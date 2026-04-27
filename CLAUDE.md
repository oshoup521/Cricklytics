# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start Commands

### Development Setup
```bash
# Combined setup (runs both frontend and backend)
./dev-start.sh

# Or manual setup:
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -c "from server import init_database; init_database()"
uvicorn server:app --host 0.0.0.0 --port 8000 --reload

# Frontend (in another terminal)
cd frontend
npm install
npm start  # Runs on http://localhost:3000
```

### Build Commands
```bash
./build.sh                # Frontend build only (npm ci && npm run build)
cd frontend && npm run build  # Manual frontend build
```

### Testing
```bash
cd backend
python test_server.py     # Basic API test
python test_commentary.py # Ball data and commentary test (adds sample data)
python test_stats.py      # Statistics test
```

### Development Notes
- API Base URL is controlled by REACT_APP_API_URL environment variable in frontend
- Local development: Backend on http://localhost:8000, Frontend on http://localhost:3000
- API docs available at http://localhost:8000/docs (Swagger UI)
- Database initialization is automatic in server.py on startup via init_database()

## Architecture Overview

### High-Level Structure
Cricklytics is a full-stack cricket scoring application built as a monorepo:
- **Frontend** (/frontend): Single Page Application (React/CRA) with real-time match scoring
- **Backend** (/backend): RESTful API (FastAPI) with SQLite database
- **Deployment**: Vercel (frontend) + Render (backend)

### Frontend Architecture (React)
**Core Pattern**: Auth context + React Router with protected routes

The main App.js (~212 KB) contains:
- AuthContext for user state and authentication methods (login, register, logout)
- Routes for public pages (home, login, register, match listings) and protected pages (match creation, live scoring, team management)
- Pages: HomePage, LoginPage, RegisterPage, MatchesPage, MatchDetailPage, MatchStatsPage, CreateMatchPage, ScoringPage, TeamsPage
- ProtectedRoute wrapper that redirects unauthenticated users to login
- Axios configured with JWT Bearer token in Authorization header
- Mobile enhancements in mobileEnhancements.js

API calls use axios with REACT_APP_API_URL as base URL (configured per environment).

### Backend Architecture (FastAPI)
**Core Pattern**: Dependency injection with JWT token verification

The main server.py (1351 lines) provides:
- User authentication via /api/register and /api/login with JWT tokens
- Match CRUD and state management (create, fetch, update status/state)
- Ball-by-ball scoring with commentary
- Team management (standalone reusable teams and match-specific teams)
- Statistics endpoints (partnerships, aggregated match stats, global platform stats)
- CORS configured for multiple deployment domains

**Database Design**:
- **users**: id, username, email, password_hash, role, created_at
- **matches**: Match metadata (teams, date, venue, toss info, current_innings, status)
- **balls**: Ball-by-ball data (over_number, ball_number, batsman, bowler, runs, extras, wickets, commentary, legal_ball_number)
- **teams**: Match-specific team data (players list as JSON string)
- **standalone_teams**: Reusable team templates (can be used across multiple matches)
- **match_state**: Current match state (batsmen on strike, bowler, current innings)
- **team_match_usage**: Tracks which teams are used in which matches

**Key API Endpoints** (25+ total):
- Auth: POST /api/register, POST /api/login, GET /api/me
- Matches: POST /api/matches, GET /api/matches, GET /api/matches/{match_id}, PATCH /api/matches/{match_id}/status, POST /api/matches/{match_id}/score
- Teams: GET /api/teams, POST /api/teams, PUT /api/teams/{team_name}, DELETE /api/teams/{team_name}
- Stats: GET /api/matches/{match_id}/statistics, GET /api/matches/{match_id}/partnerships, GET /api/matches/{match_id}/visualization, GET /api/stats/global

### Data Flow
1. **Authentication**: Frontend sends credentials to /api/register or /api/login, receives JWT token, stores in localStorage
2. **Match Scoring**: Frontend maintains match state locally, POSTs ball data to /api/matches/{match_id}/score, server updates database and returns aggregated stats
3. **Live Updates**: Frontend polls /api/matches/{match_id}/score to display current match state
4. **Statistics**: Computed on-the-fly from balls table (partnerships, averages, strike rates)

## Tech Stack
- **Frontend**: React 18.2, React Router v6, Axios, Tailwind CSS 3.3.2, Create React App (react-scripts 5.0.1)
- **Backend**: FastAPI 0.115.0, Uvicorn 0.32.0, Pydantic 2.10.3, JWT/bcrypt authentication
- **Database**: SQLite3 (single-file cricklytics.db)
- **Deployment**: Vercel (frontend), Render (backend with Docker), GitHub for source control

## Deployment Architecture
- **Frontend**: Deployed on Vercel. Build command: npm run build (output in /frontend/build)
- **Backend**: Deployed on Render using Docker. Dockerfile in /backend builds Python 3.11.9 image, runs uvicorn server:app
- **API Routing**: Vercel's vercel.json rewrites /api/* requests to https://cricklytics.onrender.com/api/$1
- **Security**: CORS headers configured in FastAPI; Vercel applies additional security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
- **Domains**: Production at custom domain, Vercel default domains, and localhost in development

See DEPLOYMENT.md and DEPLOYMENT_CHECKLIST.md for detailed deployment guides.

## Important Implementation Details

### Ball-by-Ball Scoring
- Balls are tracked with over_number, ball_number (includes wides/no-balls), and legal_ball_number (excludes extras)
- Wickets stored with wicket_type (bowled, caught, lbw, etc.) and wicket_player (player dismissed)
- Extras tracked separately: extras_type can be "wide", "no-ball", "bye", "leg-bye", or null (regular runs)
- Commentary field stores human-readable ball descriptions

### Team Management
Two separate team concepts:
- **Standalone teams** (standalone_teams table): Reusable team templates created by users, tracked across matches via team_match_usage
- **Match teams** (teams table): Match-specific team data, linked to a particular match

### Match State
match_state table tracks current batsmen, bowler, and innings while match is live. Updated when balls are scored.

### Authentication
- Passwords hashed with bcrypt
- JWTs signed with SECRET_KEY (environment variable, default "osho" in dev)
- Token expiry: 30 minutes
- Bearer token passed in Authorization: Bearer <token> header

## Common Tasks

### Adding a New Match Endpoint
1. Create Pydantic model for request body in server.py (around line 199+)
2. Add @app.get/post/patch/delete decorator with route
3. Include current_user: str = Depends(verify_token) parameter for protected endpoints
4. Use with get_db() as conn context manager for database access
5. Return response as dict or Pydantic model

### Adding a Frontend Page
1. Create component in frontend/src/App.js (or extract to separate file if needed)
2. Add <Route path="/new-route" element={<NewPage />} /> in the Routes block
3. Wrap with <ProtectedRoute> if authentication required
4. Use axios with configured base URL: axios.get('/api/endpoint')

### Testing Database Changes
- Run python test_commentary.py to populate sample match data for testing
- Check cricklytics.db with sqlite3 CLI: sqlite3 backend/cricklytics.db
- Reset database by deleting cricklytics.db (will be recreated on next server start)

## Files and Directories
- /frontend: Create React App (public, src, node_modules, package.json)
- /backend: FastAPI application (server.py, requirements.txt, Dockerfile, tests)
- dev-start.sh / dev-start.ps1: Local development startup scripts
- build.sh: Frontend build script
- vercel.json: Vercel deployment configuration (build settings, rewrites, security headers)
- DEPLOYMENT.md, DEPLOYMENT_CHECKLIST.md, RENDER_SETUP.md: Deployment guides
