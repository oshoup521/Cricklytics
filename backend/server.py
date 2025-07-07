from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import sqlite3
import bcrypt
import jwt
from datetime import datetime, timedelta
import uuid
import os
from contextlib import contextmanager

# Configuration
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

app = FastAPI(title="Cricklytics API", version="1.0.0")

# CORS configuration
allowed_origins = [
    "http://localhost:3000",  # Local development
    "https://cricklytics.oshoupadhyay.in",  # Production subdomain
    "https://oshoupadhyay.in",  # Main domain
    "https://www.oshoupadhyay.in",  # WWW subdomain
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Database setup
DATABASE_FILE = "cricklytics.db"

@contextmanager
def get_db():
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_database():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'scorer',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Matches table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS matches (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                date TEXT NOT NULL,
                venue TEXT NOT NULL,
                match_type TEXT NOT NULL,
                team1 TEXT NOT NULL,
                team2 TEXT NOT NULL,
                toss_winner TEXT,
                toss_decision TEXT,
                batting_first TEXT,
                status TEXT DEFAULT 'setup',
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id)
            )
        """)
        
        # Teams table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS teams (
                id TEXT PRIMARY KEY,
                match_id TEXT NOT NULL,
                name TEXT NOT NULL,
                players TEXT NOT NULL,
                FOREIGN KEY (match_id) REFERENCES matches(id)
            )
        """)
        
        # Balls table for ball-by-ball scoring
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS balls (
                id TEXT PRIMARY KEY,
                match_id TEXT NOT NULL,
                innings INTEGER NOT NULL,
                over_number INTEGER NOT NULL,
                ball_number INTEGER NOT NULL,
                legal_ball_number INTEGER NOT NULL DEFAULT 1,
                batsman TEXT NOT NULL,
                bowler TEXT NOT NULL,
                runs INTEGER DEFAULT 0,
                extras INTEGER DEFAULT 0,
                extras_type TEXT,
                wicket BOOLEAN DEFAULT FALSE,
                wicket_type TEXT,
                wicket_player TEXT,
                commentary TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (match_id) REFERENCES matches(id)
            )
        """)
        
        # Standalone teams table for team management
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS standalone_teams (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                players TEXT NOT NULL,
                captain TEXT,
                vice_captain TEXT,
                total_matches INTEGER DEFAULT 0,
                created_by TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id)
            )
        """)
        
        # Team match usage tracking table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS team_match_usage (
                id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
                team_name TEXT NOT NULL,
                match_id TEXT NOT NULL,
                match_name TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (match_id) REFERENCES matches(id)
            )
        """)
        
        # Match state table for storing current batsmen, bowler, etc.
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS match_state (
                match_id TEXT PRIMARY KEY,
                current_striker TEXT,
                current_non_striker TEXT,
                current_bowler TEXT,
                on_strike TEXT DEFAULT 'striker',
                current_innings INTEGER DEFAULT 1,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (match_id) REFERENCES matches(id)
            )
        """)
        
        # Migration: Add legal_ball_number column if it doesn't exist
        cursor.execute("PRAGMA table_info(balls)")
        columns = [column[1] for column in cursor.fetchall()]
        if 'legal_ball_number' not in columns:
            cursor.execute("ALTER TABLE balls ADD COLUMN legal_ball_number INTEGER NOT NULL DEFAULT 1")
            # Update existing records to calculate legal ball numbers
            cursor.execute("""
                UPDATE balls SET legal_ball_number = (
                    SELECT COUNT(*) + 1 FROM balls b2 
                    WHERE b2.match_id = balls.match_id 
                    AND b2.innings = balls.innings 
                    AND b2.over_number = balls.over_number 
                    AND b2.id < balls.id
                    AND (b2.extras_type IS NULL OR b2.extras_type NOT IN ('wide', 'no-ball'))
                )
                WHERE extras_type IS NULL OR extras_type NOT IN ('wide', 'no-ball')
            """)
            # For wides and no-balls, keep the same legal ball number as the previous legal ball
            cursor.execute("""
                UPDATE balls SET legal_ball_number = (
                    SELECT COALESCE(MAX(b2.legal_ball_number), 1) FROM balls b2 
                    WHERE b2.match_id = balls.match_id 
                    AND b2.innings = balls.innings 
                    AND b2.over_number = balls.over_number 
                    AND b2.id < balls.id
                    AND (b2.extras_type IS NULL OR b2.extras_type NOT IN ('wide', 'no-ball'))
                )
                WHERE extras_type IN ('wide', 'no-ball')
            """)
        
        conn.commit()

# Pydantic models
class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class PlayerCreate(BaseModel):
    name: str
    role: str

class TeamCreate(BaseModel):
    name: str
    players: List[PlayerCreate]

class MatchCreate(BaseModel):
    name: str
    date: str
    venue: str
    match_type: str = Field(alias="matchType")  # Accept matchType from frontend but map to match_type
    team1: str  # Team name instead of TeamCreate object
    team2: str  # Team name instead of TeamCreate object
    toss_winner: Optional[str] = Field(default=None, alias="tossWinner")
    toss_decision: Optional[str] = Field(default=None, alias="tossDecision")
    batting_first: Optional[str] = Field(default=None, alias="battingFirst")

class BallScore(BaseModel):
    match_id: str
    innings: int
    over_number: int
    ball_number: int
    batsman: str
    bowler: str
    runs: int = 0
    extras: int = 0
    extras_type: Optional[str] = None
    wicket: bool = False
    wicket_type: Optional[str] = None
    wicket_player: Optional[str] = None
    commentary: Optional[str] = None

class MatchStatus(BaseModel):
    status: str

class MatchState(BaseModel):
    current_striker: Optional[str] = None
    current_non_striker: Optional[str] = None
    current_bowler: Optional[str] = None
    on_strike: str = 'striker'
    current_innings: int = 1

class InningsData(BaseModel):
    match_id: str
    innings: int
    batting_team: str
    bowling_team: str
    target: Optional[int] = None

# Authentication utilities
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return username
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# API Routes
@app.get("/")
def root():
    return {"message": "Cricklytics API is running!"}

@app.post("/api/register", response_model=Token)
def register(user: UserRegister):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE username = ? OR email = ?", 
                      (user.username, user.email))
        if cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or email already registered"
            )
        
        # Hash password
        password_hash = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
        
        # Create user
        user_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO users (id, username, email, password_hash, role)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, user.username, user.email, password_hash.decode('utf-8'), 'scorer'))
        
        conn.commit()
        
        # Create token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        
        return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/login", response_model=Token)
def login(user: UserLogin):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT username, password_hash FROM users WHERE username = ?", 
                      (user.username,))
        db_user = cursor.fetchone()
        
        if not db_user or not bcrypt.checkpw(user.password.encode('utf-8'), 
                                           db_user['password_hash'].encode('utf-8')):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        
        return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/me")
def get_current_user(current_user: str = Depends(verify_token)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, email, role FROM users WHERE username = ?", 
                      (current_user,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return dict(user)

@app.post("/api/matches")
def create_match(match: MatchCreate, current_user: str = Depends(verify_token)):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Get user ID
        cursor.execute("SELECT id FROM users WHERE username = ?", (current_user,))
        user_row = cursor.fetchone()
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_row['id']
        
        # Validate that both teams exist in the standalone teams table
        cursor.execute("SELECT * FROM standalone_teams WHERE name = ?", (match.team1,))
        team1_data = cursor.fetchone()
        if not team1_data:
            raise HTTPException(status_code=404, detail=f"Team '{match.team1}' not found")
        
        cursor.execute("SELECT * FROM standalone_teams WHERE name = ?", (match.team2,))
        team2_data = cursor.fetchone()
        if not team2_data:
            raise HTTPException(status_code=404, detail=f"Team '{match.team2}' not found")
        
        match_id = str(uuid.uuid4())
        
        # Create match with team names
        cursor.execute("""
            INSERT INTO matches (id, name, date, venue, match_type, team1, team2, 
                               toss_winner, toss_decision, batting_first, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (match_id, match.name, match.date, match.venue, match.match_type,
              match.team1, match.team2, match.toss_winner, match.toss_decision,
              match.batting_first, user_id))
        
        # Create teams in the match-specific teams table (for match context)
        team1_id = str(uuid.uuid4())
        team2_id = str(uuid.uuid4())
        
        # Copy team data from standalone teams
        cursor.execute("""
            INSERT INTO teams (id, match_id, name, players)
            VALUES (?, ?, ?, ?)
        """, (team1_id, match_id, match.team1, team1_data['players']))
        
        cursor.execute("""
            INSERT INTO teams (id, match_id, name, players)
            VALUES (?, ?, ?, ?)
        """, (team2_id, match_id, match.team2, team2_data['players']))
        
        # Update team usage count in standalone teams
        cursor.execute("""
            UPDATE standalone_teams 
            SET total_matches = total_matches + 1
            WHERE name IN (?, ?)
        """, (match.team1, match.team2))
        
        # Add match usage record
        cursor.execute("""
            INSERT INTO team_match_usage (id, team_name, match_id, match_name)
            VALUES (lower(hex(randomblob(16))), ?, ?, ?)
        """, (match.team1, match_id, match.name))
        
        cursor.execute("""
            INSERT INTO team_match_usage (id, team_name, match_id, match_name)
            VALUES (lower(hex(randomblob(16))), ?, ?, ?)
        """, (match.team2, match_id, match.name))
        
        conn.commit()
        
        return {"message": "Match created successfully", "match_id": match_id}

@app.get("/api/matches")
def get_matches():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT m.*, u.username as created_by_name
            FROM matches m
            LEFT JOIN users u ON m.created_by = u.id
            ORDER BY m.created_at DESC
        """)
        matches = [dict(row) for row in cursor.fetchall()]
        return matches

@app.get("/api/matches/{match_id}")
def get_match(match_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM matches WHERE id = ?", (match_id,))
        match = cursor.fetchone()
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Get teams
        cursor.execute("SELECT * FROM teams WHERE match_id = ?", (match_id,))
        teams = [dict(row) for row in cursor.fetchall()]
        
        match_dict = dict(match)
        match_dict['teams'] = teams
        
        return match_dict

@app.patch("/api/matches/{match_id}/start")
def start_match(match_id: str, current_user: str = Depends(verify_token)):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if match exists and user has permission
        cursor.execute("SELECT * FROM matches WHERE id = ?", (match_id,))
        match = cursor.fetchone()
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Update match status
        cursor.execute("UPDATE matches SET status = 'live' WHERE id = ?", (match_id,))
        conn.commit()
        
        return {"message": "Match started successfully"}

@app.patch("/api/matches/{match_id}/status")
def update_match_status(match_id: str, status: str, current_user: str = Depends(verify_token)):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Validate status
        valid_statuses = ['setup', 'live', 'paused', 'completed']
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail="Invalid status")
        
        # Check if match exists
        cursor.execute("SELECT * FROM matches WHERE id = ?", (match_id,))
        match = cursor.fetchone()
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Update match status
        cursor.execute("UPDATE matches SET status = ? WHERE id = ?", (status, match_id))
        conn.commit()
        
        return {"message": f"Match status updated to {status}"}

@app.get("/api/matches/{match_id}/teams")
def get_match_teams(match_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM teams WHERE match_id = ?", (match_id,))
        teams = [dict(row) for row in cursor.fetchall()]
        return teams

@app.get("/api/matches/{match_id}/state")
def get_match_state(match_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM match_state WHERE match_id = ?", (match_id,))
        state = cursor.fetchone()
        if state:
            return dict(state)
        else:
            # Return default state if none exists
            return {
                "match_id": match_id,
                "current_striker": None,
                "current_non_striker": None,
                "current_bowler": None,
                "on_strike": "striker",
                "current_innings": 1
            }

@app.post("/api/matches/{match_id}/state")
def update_match_state(match_id: str, state: MatchState, current_user: str = Depends(verify_token)):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if state exists
        cursor.execute("SELECT match_id FROM match_state WHERE match_id = ?", (match_id,))
        existing = cursor.fetchone()
        
        if existing:
            # Update existing state
            cursor.execute("""
                UPDATE match_state 
                SET current_striker = ?, current_non_striker = ?, current_bowler = ?, 
                    on_strike = ?, current_innings = ?, updated_at = CURRENT_TIMESTAMP
                WHERE match_id = ?
            """, (state.current_striker, state.current_non_striker, state.current_bowler,
                  state.on_strike, state.current_innings, match_id))
        else:
            # Insert new state
            cursor.execute("""
                INSERT INTO match_state 
                (match_id, current_striker, current_non_striker, current_bowler, on_strike, current_innings)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (match_id, state.current_striker, state.current_non_striker, state.current_bowler,
                  state.on_strike, state.current_innings))
        
        conn.commit()
        return {"message": "Match state updated successfully"}

@app.post("/api/matches/{match_id}/score")
def add_ball_score(match_id: str, ball_data: BallScore, current_user: str = Depends(verify_token)):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Verify match exists and is live
        cursor.execute("SELECT status FROM matches WHERE id = ?", (match_id,))
        match = cursor.fetchone()
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        if match['status'] != 'live':
            raise HTTPException(status_code=400, detail="Match is not live")
        
        # Calculate the legal ball number (counts only valid deliveries)
        if ball_data.extras_type in ['wide', 'no-ball']:
            # For wides and no-balls, use the same legal ball number as the current legal ball count
            cursor.execute("""
                SELECT COALESCE(MAX(legal_ball_number), 0) FROM balls 
                WHERE match_id = ? AND innings = ? AND over_number = ? 
                AND (extras_type IS NULL OR extras_type NOT IN ('wide', 'no-ball'))
            """, (match_id, ball_data.innings, ball_data.over_number))
            
            legal_ball_number = cursor.fetchone()[0]
            if legal_ball_number == 0:
                legal_ball_number = 1  # First ball of the over
        else:
            # For valid deliveries, increment the legal ball count
            cursor.execute("""
                SELECT COUNT(*) FROM balls 
                WHERE match_id = ? AND innings = ? AND over_number = ? 
                AND (extras_type IS NULL OR extras_type NOT IN ('wide', 'no-ball'))
            """, (match_id, ball_data.innings, ball_data.over_number))
            
            legal_balls_in_over = cursor.fetchone()[0]
            legal_ball_number = legal_balls_in_over + 1
        
        # Auto-generate commentary if none provided
        commentary = ball_data.commentary
        if not commentary:
            commentary = generate_ball_commentary(ball_data)
        
        # Insert ball data
        ball_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO balls (id, match_id, innings, over_number, ball_number, legal_ball_number,
                             batsman, bowler, runs, extras, extras_type, wicket, 
                             wicket_type, wicket_player, commentary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (ball_id, match_id, ball_data.innings, ball_data.over_number, 
              ball_data.ball_number, legal_ball_number, ball_data.batsman, ball_data.bowler,
              ball_data.runs, ball_data.extras, ball_data.extras_type,
              ball_data.wicket, ball_data.wicket_type, ball_data.wicket_player,
              commentary))
        
        conn.commit()
        return {"message": "Ball scored successfully", "ball_id": ball_id}

def generate_ball_commentary(ball_data: BallScore) -> str:
    """Generate basic commentary for a ball"""
    runs = ball_data.runs or 0
    extras = ball_data.extras or 0
    total_runs = runs + extras
    
    if ball_data.wicket:
        wicket_type = ball_data.wicket_type or "out"
        wicket_player = ball_data.wicket_player or "the batsman"
        return f"{wicket_player} is {wicket_type}! {ball_data.bowler} strikes!"
    
    if ball_data.extras_type:
        extras_type = ball_data.extras_type
        if extras_type == "wide":
            return f"Wide delivery! {ball_data.bowler} strays down the leg side"
        elif extras_type == "no-ball":
            return f"No Ball! {ball_data.bowler} oversteps the crease"
        elif extras_type == "bye":
            return f"Byes! The ball beats everyone and they scamper through"
        elif extras_type == "leg-bye":
            return f"Leg bye! Off the pads and they take a run"
    
    if runs == 0:
        return f"Dot ball! {ball_data.bowler} keeps it tight"
    elif runs == 1:
        return f"Single taken! {ball_data.batsman} rotates the strike"
    elif runs == 2:
        return f"Two runs! Good running between the wickets"
    elif runs == 3:
        return f"Three runs! Excellent running by {ball_data.batsman}"
    elif runs == 4:
        return f"FOUR! {ball_data.batsman} finds the boundary with a lovely shot"
    elif runs == 6:
        return f"SIX! {ball_data.batsman} sends it sailing over the boundary!"
    else:
        return f"{runs} runs! {ball_data.batsman} keeps the scoreboard ticking"

@app.get("/api/matches/{match_id}/score")
def get_match_score(match_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Get match details
        cursor.execute("SELECT * FROM matches WHERE id = ?", (match_id,))
        match = cursor.fetchone()
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Get all balls for the match
        cursor.execute("""
            SELECT * FROM balls WHERE match_id = ? 
            ORDER BY innings, over_number, ball_number
        """, (match_id,))
        balls = [dict(row) for row in cursor.fetchall()]
        
        # Calculate current score by innings
        innings_scores = {}
        current_over = {"innings": 1, "over": 0, "ball": 0}
        
        for ball in balls:
            innings = ball['innings']
            if innings not in innings_scores:
                innings_scores[innings] = {
                    "runs": 0,
                    "wickets": 0,
                    "overs": 0,
                    "balls": 0,
                    "extras": 0
                }
            
            innings_scores[innings]["runs"] += ball['runs'] + ball['extras']
            innings_scores[innings]["extras"] += ball['extras']
            
            if ball['wicket']:
                innings_scores[innings]["wickets"] += 1
            
            # Count balls (excluding wides and no-balls for over calculation)
            if ball['extras_type'] is None or ball['extras_type'] not in ['wide', 'no-ball']:
                innings_scores[innings]["balls"] += 1
            
            # Update current over info
            if ball['innings'] >= current_over["innings"]:
                current_over = {
                    "innings": ball['innings'],
                    "over": ball['over_number'],
                    "ball": ball['ball_number']
                }
        
        # Calculate overs completed
        for innings in innings_scores:
            total_balls = innings_scores[innings]["balls"]
            innings_scores[innings]["overs"] = total_balls // 6
            innings_scores[innings]["balls_in_current_over"] = total_balls % 6
        
        # Get current match state
        cursor.execute("SELECT * FROM match_state WHERE match_id = ?", (match_id,))
        match_state = cursor.fetchone()
        state_dict = dict(match_state) if match_state else {
            "current_striker": None,
            "current_non_striker": None,
            "current_bowler": None,
            "on_strike": "striker",
            "current_innings": 1
        }
        
        return {
            "match": dict(match),
            "innings_scores": innings_scores,
            "current_over": current_over,
            "match_state": state_dict,
            "balls": balls[-10:] if balls else []  # Last 10 balls
        }

@app.get("/api/matches/{match_id}/balls")
def get_match_balls(match_id: str, innings: Optional[int] = None):
    with get_db() as conn:
        cursor = conn.cursor()
        
        query = "SELECT * FROM balls WHERE match_id = ?"
        params = [match_id]
        
        if innings:
            query += " AND innings = ?"
            params.append(innings)
        
        query += " ORDER BY innings, over_number, ball_number"
        
        cursor.execute(query, params)
        balls = [dict(row) for row in cursor.fetchall()]
        return balls

@app.delete("/api/matches/{match_id}/balls/{ball_id}")
def delete_ball(match_id: str, ball_id: str, current_user: str = Depends(verify_token)):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Verify ball exists and belongs to match
        cursor.execute("SELECT * FROM balls WHERE id = ? AND match_id = ?", (ball_id, match_id))
        ball = cursor.fetchone()
        if not ball:
            raise HTTPException(status_code=404, detail="Ball not found")
        
        # Delete the ball
        cursor.execute("DELETE FROM balls WHERE id = ?", (ball_id,))
        conn.commit()
        
        return {"message": "Ball deleted successfully"}

@app.get("/api/matches/{match_id}/partnerships")
def get_partnerships(match_id: str, innings: int):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Get all balls for the innings
        cursor.execute("""
            SELECT * FROM balls WHERE match_id = ? AND innings = ?
            ORDER BY over_number, ball_number
        """, (match_id, innings))
        balls = [dict(row) for row in cursor.fetchall()]
        
        partnerships = []
        current_partnership = {"batsman1": "", "batsman2": "", "runs": 0, "balls": 0}
        
        # This is a simplified partnership calculation
        # In a real implementation, you'd track when batsmen change
        
        return partnerships

@app.get("/api/matches/{match_id}/statistics")
def get_match_statistics(match_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Get match details
        cursor.execute("SELECT * FROM matches WHERE id = ?", (match_id,))
        match = cursor.fetchone()
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Get all balls for the match
        cursor.execute("""
            SELECT * FROM balls WHERE match_id = ? 
            ORDER BY innings, over_number, ball_number
        """, (match_id,))
        balls = [dict(row) for row in cursor.fetchall()]
        
        # Calculate batting statistics
        batting_stats = {}
        bowling_stats = {}
        
        for ball in balls:
            batsman = ball['batsman']
            bowler = ball['bowler']
            innings = ball['innings']
            
            # Initialize batting stats
            if batsman not in batting_stats:
                batting_stats[batsman] = {
                    "name": batsman,
                    "runs": 0,
                    "balls": 0,
                    "fours": 0,
                    "sixes": 0,
                    "strike_rate": 0,
                    "innings": innings
                }
            
            # Initialize bowling stats  
            if bowler not in bowling_stats:
                bowling_stats[bowler] = {
                    "name": bowler,
                    "runs_conceded": 0,
                    "balls_bowled": 0,
                    "wickets": 0,
                    "economy_rate": 0,
                    "innings": innings
                }
            
            # Update batting stats
            batting_stats[batsman]["runs"] += ball['runs']
            if ball['extras_type'] is None or ball['extras_type'] not in ['wide', 'no-ball']:
                batting_stats[batsman]["balls"] += 1
            
            if ball['runs'] == 4:
                batting_stats[batsman]["fours"] += 1
            elif ball['runs'] == 6:
                batting_stats[batsman]["sixes"] += 1
            
            # Update bowling stats
            bowling_stats[bowler]["runs_conceded"] += ball['runs'] + ball['extras']
            if ball['extras_type'] is None or ball['extras_type'] not in ['wide', 'no-ball']:
                bowling_stats[bowler]["balls_bowled"] += 1
            
            if ball['wicket']:
                bowling_stats[bowler]["wickets"] += 1
        
        # Calculate derived statistics
        for batsman in batting_stats:
            stats = batting_stats[batsman]
            if stats["balls"] > 0:
                stats["strike_rate"] = round((stats["runs"] / stats["balls"]) * 100, 2)
        
        for bowler in bowling_stats:
            stats = bowling_stats[bowler]
            if stats["balls_bowled"] > 0:
                overs = stats["balls_bowled"] / 6
                stats["economy_rate"] = round(stats["runs_conceded"] / overs, 2) if overs > 0 else 0
        
        # Calculate fall of wickets
        fall_of_wickets = []
        team_score = 0
        team_wickets = 0
        
        for ball in balls:
            team_score += ball['runs'] + ball['extras']
            if ball['wicket']:
                team_wickets += 1
                fall_of_wickets.append({
                    "wicket_number": team_wickets,
                    "player": ball['wicket_player'],
                    "score": team_score,
                    "over": f"{ball['over_number']}.{ball['ball_number']}",
                    "wicket_type": ball['wicket_type']
                })
        
        return {
            "match": dict(match),
            "batting_statistics": list(batting_stats.values()),
            "bowling_statistics": list(bowling_stats.values()),
            "fall_of_wickets": fall_of_wickets,
            "total_balls": len(balls)
        }

@app.get("/api/matches/{match_id}/ai-analysis")
def get_ai_analysis(match_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Get match statistics
        stats = get_match_statistics(match_id)
        
        batting_stats = stats["batting_statistics"]
        bowling_stats = stats["bowling_statistics"] 
        match = stats["match"]
        
        # AI Man of the Match Algorithm
        player_scores = {}
        
        # Batting performance scoring
        for batsman in batting_stats:
            if batsman["balls"] > 0:  # Only consider players who faced balls
                score = 0
                
                # Base score from runs (1 point per run)
                score += batsman["runs"]
                
                # Strike rate bonus/penalty
                strike_rate = batsman["strike_rate"]
                if strike_rate > 150:
                    score += 20  # Excellent strike rate
                elif strike_rate > 120:
                    score += 10  # Good strike rate
                elif strike_rate < 80:
                    score -= 10  # Poor strike rate
                
                # Boundary bonus
                score += batsman["fours"] * 2  # 2 points per four
                score += batsman["sixes"] * 4   # 4 points per six
                
                # Milestone bonuses
                if batsman["runs"] >= 50:
                    score += 15  # Half century bonus
                if batsman["runs"] >= 100:
                    score += 25  # Century bonus
                
                player_scores[batsman["name"]] = {
                    "score": score,
                    "type": "batting",
                    "details": f"{batsman['runs']} runs from {batsman['balls']} balls (SR: {batsman['strike_rate']})"
                }
        
        # Bowling performance scoring
        for bowler in bowling_stats:
            if bowler["balls_bowled"] > 0:  # Only consider bowlers who bowled
                score = 0
                
                # Wicket bonus (major factor)
                score += bowler["wickets"] * 20
                
                # Economy rate bonus/penalty
                economy = bowler["economy_rate"]
                if economy < 4:
                    score += 15  # Excellent economy
                elif economy < 6:
                    score += 8   # Good economy  
                elif economy > 10:
                    score -= 10  # Poor economy
                elif economy > 8:
                    score -= 5   # Below average economy
                
                # Milestone bonuses
                if bowler["wickets"] >= 3:
                    score += 15  # Three-wicket haul
                if bowler["wickets"] >= 5:
                    score += 25  # Five-wicket haul
                
                overs = bowler["balls_bowled"] / 6
                player_scores[bowler["name"]] = {
                    "score": score,
                    "type": "bowling", 
                    "details": f"{bowler['wickets']} wickets in {overs:.1f} overs (ER: {bowler['economy_rate']})"
                }
        
        # Find Man of the Match
        if player_scores:
            mom = max(player_scores.items(), key=lambda x: x[1]["score"])
            man_of_match = {
                "player": mom[0],
                "score": mom[1]["score"],
                "type": mom[1]["type"],
                "details": mom[1]["details"],
                "reasoning": f"Outstanding {mom[1]['type']} performance with {mom[1]['details']}"
            }
        else:
            man_of_match = None
        
        # Generate match insights
        insights = []
        
        # Top scorer insight
        if batting_stats:
            top_scorer = max(batting_stats, key=lambda x: x["runs"])
            if top_scorer["runs"] > 0:
                insights.append(f"Highest scorer: {top_scorer['name']} with {top_scorer['runs']} runs")
        
        # Best bowler insight
        if bowling_stats:
            best_bowler = max(bowling_stats, key=lambda x: x["wickets"])
            if best_bowler["wickets"] > 0:
                insights.append(f"Best bowler: {best_bowler['name']} with {best_bowler['wickets']} wickets")
        
        # Strike rate insights
        if batting_stats:
            fastest_scorer = max(batting_stats, key=lambda x: x["strike_rate"] if x["balls"] > 5 else 0)
            if fastest_scorer["balls"] > 5:
                insights.append(f"Fastest scorer: {fastest_scorer['name']} (SR: {fastest_scorer['strike_rate']})")
        
        # Economy insights
        if bowling_stats:
            most_economical = min(bowling_stats, key=lambda x: x["economy_rate"] if x["balls_bowled"] > 5 else 999)
            if most_economical["balls_bowled"] > 5:
                insights.append(f"Most economical: {most_economical['name']} (ER: {most_economical['economy_rate']})")
        
        return {
            "man_of_match": man_of_match,
            "player_scores": player_scores,
            "insights": insights,
            "match_summary": {
                "total_runs": sum(b["runs"] for b in batting_stats),
                "total_wickets": len(stats["fall_of_wickets"]),
                "total_balls": stats["total_balls"],
                "boundaries": sum(b["fours"] + b["sixes"] for b in batting_stats)
            }
        }

@app.get("/api/matches/{match_id}/visualization")
def get_visualization_data(match_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Get all balls for the match
        cursor.execute("""
            SELECT * FROM balls WHERE match_id = ? 
            ORDER BY innings, over_number, ball_number
        """, (match_id,))
        balls = [dict(row) for row in cursor.fetchall()]
        
        # Calculate run progression by over
        run_progression = []
        cumulative_runs = 0
        current_over = -1
        over_runs = 0
        
        for ball in balls:
            if ball['over_number'] != current_over:
                if current_over >= 0:
                    run_progression.append({
                        "over": current_over + 1,
                        "runs_in_over": over_runs,
                        "cumulative_runs": cumulative_runs
                    })
                current_over = ball['over_number']
                over_runs = 0
            
            run_value = ball['runs'] + ball['extras']
            over_runs += run_value
            cumulative_runs += run_value
        
        # Add final over
        if current_over >= 0:
            run_progression.append({
                "over": current_over + 1,
                "runs_in_over": over_runs,
                "cumulative_runs": cumulative_runs
            })
        
        # Calculate wicket timeline
        wicket_timeline = []
        cumulative_runs = 0
        
        for ball in balls:
            cumulative_runs += ball['runs'] + ball['extras']
            if ball['wicket']:
                wicket_timeline.append({
                    "over": f"{ball['over_number']}.{ball['ball_number']}",
                    "player": ball['wicket_player'],
                    "score": cumulative_runs,
                    "wicket_type": ball['wicket_type']
                })
        
        # Calculate ball-by-ball analysis for recent balls
        recent_balls = []
        for ball in balls[-20:]:  # Last 20 balls
            recent_balls.append({
                "over": f"{ball['over_number']}.{ball['ball_number']}",
                "batsman": ball['batsman'],
                "bowler": ball['bowler'],
                "runs": ball['runs'],
                "extras": ball['extras'],
                "extras_type": ball['extras_type'],
                "wicket": ball['wicket'],
                "commentary": ball['commentary']
            })
        
        return {
            "run_progression": run_progression,
            "wicket_timeline": wicket_timeline,
            "recent_balls": recent_balls,
            "total_balls": len(balls)
        }

@app.delete("/api/matches/{match_id}")
def delete_match(match_id: str, current_user: str = Depends(verify_token)):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if match exists and user has permission
        cursor.execute("SELECT created_by FROM matches WHERE id = ?", (match_id,))
        match = cursor.fetchone()
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Get user ID to check permissions
        cursor.execute("SELECT id FROM users WHERE username = ?", (current_user,))
        user_row = cursor.fetchone()
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if user is the creator of the match
        if match['created_by'] != user_row['id']:
            raise HTTPException(status_code=403, detail="Not authorized to delete this match")
        
        # Delete related data first (foreign key constraints)
        cursor.execute("DELETE FROM balls WHERE match_id = ?", (match_id,))
        cursor.execute("DELETE FROM teams WHERE match_id = ?", (match_id,))
        cursor.execute("DELETE FROM matches WHERE id = ?", (match_id,))
        
        conn.commit()
        
        return {"message": "Match deleted successfully"}

# Team Management Endpoints

@app.get("/api/teams")
def get_user_teams(current_user: str = Depends(verify_token)):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Get user ID
        cursor.execute("SELECT id FROM users WHERE username = ?", (current_user,))
        user_row = cursor.fetchone()
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_row['id']
        
        # Get all teams from standalone_teams created by the user
        cursor.execute("""
            SELECT st.*, 
                   COALESCE(
                       (SELECT json_group_array(
                           json_object('match_id', tmu.match_id, 'match_name', tmu.match_name)
                       ) FROM team_match_usage tmu WHERE tmu.team_name = st.name), 
                       '[]'
                   ) as matches_used_json
            FROM standalone_teams st
            WHERE st.created_by = ?
            ORDER BY st.created_at DESC
        """, (user_id,))
        
        teams_data = cursor.fetchall()
        
        # Process teams data
        teams = []
        for row in teams_data:
            # Parse players JSON
            try:
                import json
                players = json.loads(row['players'])
                matches_used = json.loads(row['matches_used_json']) if row['matches_used_json'] != '[]' else []
            except:
                players = []
                matches_used = []
            
            teams.append({
                'name': row['name'],
                'players': players,
                'captain': row['captain'],
                'viceCaptain': row['vice_captain'],
                'total_matches': row['total_matches'],
                'created_by': row['created_by'],
                'created_at': row['created_at'],
                'matches_used': matches_used
            })
        return teams

@app.post("/api/teams")
def create_team(team_data: dict, current_user: str = Depends(verify_token)):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Get user ID
        cursor.execute("SELECT id FROM users WHERE username = ?", (current_user,))
        user_row = cursor.fetchone()
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_row['id']
        
        # Validate team data
        if not team_data.get('name'):
            raise HTTPException(status_code=400, detail="Team name is required")
        
        if not team_data.get('players'):
            raise HTTPException(status_code=400, detail="At least one player is required")
        
        # Check if team name already exists for this user
        cursor.execute("""
            SELECT name FROM standalone_teams 
            WHERE name = ? AND created_by = ?
        """, (team_data['name'], user_id))
        
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Team name already exists")
        
        # Create standalone team entry
        team_id = str(uuid.uuid4())
        
        # Convert players to JSON format
        import json
        players_json = json.dumps(team_data['players'])
        
        # Get captain and vice-captain
        captain = team_data.get('captain', '')
        vice_captain = team_data.get('viceCaptain', '')
        
        cursor.execute("""
            INSERT INTO standalone_teams (id, name, players, captain, vice_captain, 
                                        total_matches, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (team_id, team_data['name'], players_json, captain, vice_captain, 0, user_id))
        
        conn.commit()
        
        return {"message": "Team created successfully", "team_id": team_id}

@app.put("/api/teams/{team_name}")
def update_team(team_name: str, team_data: dict, current_user: str = Depends(verify_token)):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Get user ID
        cursor.execute("SELECT id FROM users WHERE username = ?", (current_user,))
        user_row = cursor.fetchone()
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_row['id']
        
        # Find team belonging to user
        cursor.execute("""
            SELECT id FROM standalone_teams 
            WHERE name = ? AND created_by = ?
        """, (team_name, user_id))
        
        team_row = cursor.fetchone()
        if not team_row:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Update team
        updates = []
        params = []
        
        if 'name' in team_data:
            # Check if new name already exists
            if team_data['name'] != team_name:
                cursor.execute("""
                    SELECT name FROM standalone_teams 
                    WHERE name = ? AND created_by = ? AND id != ?
                """, (team_data['name'], user_id, team_row['id']))
                
                if cursor.fetchone():
                    raise HTTPException(status_code=400, detail="Team name already exists")
            
            updates.append("name = ?")
            params.append(team_data['name'])
        
        if 'players' in team_data:
            # Convert players to JSON format
            import json
            players_json = json.dumps(team_data['players'])
            updates.append("players = ?")
            params.append(players_json)
        
        if 'captain' in team_data:
            updates.append("captain = ?")
            params.append(team_data['captain'])
        
        if 'viceCaptain' in team_data:
            updates.append("vice_captain = ?")
            params.append(team_data['viceCaptain'])
        
        if updates:
            params.append(team_row['id'])
            cursor.execute(f"UPDATE standalone_teams SET {', '.join(updates)} WHERE id = ?", params)
            conn.commit()
        
        return {"message": "Team updated successfully"}

@app.delete("/api/teams/{team_name}")
def delete_team(team_name: str, current_user: str = Depends(verify_token)):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Get user ID
        cursor.execute("SELECT id FROM users WHERE username = ?", (current_user,))
        user_row = cursor.fetchone()
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_row['id']
        
        # Find team belonging to user
        cursor.execute("""
            SELECT id FROM standalone_teams 
            WHERE name = ? AND created_by = ?
        """, (team_name, user_id))
        
        team_row = cursor.fetchone()
        if not team_row:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Delete the standalone team
        cursor.execute("DELETE FROM standalone_teams WHERE id = ?", (team_row['id'],))
        
        # Also delete any team_match_usage records
        cursor.execute("DELETE FROM team_match_usage WHERE team_name = ?", (team_name,))
        
        conn.commit()
        
        return {"message": "Team deleted successfully"}

# Initialize database on module import
init_database()

if __name__ == "__main__":
    init_database()
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)