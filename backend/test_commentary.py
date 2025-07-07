#!/usr/bin/env python3
"""
Test script to add sample ball data with commentary to demonstrate the new Cricinfo-style UI
"""

import sqlite3
import uuid
from datetime import datetime

def add_sample_balls():
    """Add sample ball data to test the commentary system"""
    conn = sqlite3.connect('cricklytics.db')
    cursor = conn.cursor()
    
    # First check if we have any live matches
    cursor.execute("SELECT id FROM matches WHERE status = 'live' LIMIT 1")
    match = cursor.fetchone()
    
    if not match:
        print("No live matches found. Creating a test match...")
        match_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO matches (id, team1, team2, date, status, team1_score, team2_score, 
                               team1_wickets, team2_wickets, team1_overs, team2_overs, current_innings)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (match_id, "Mumbai Indians", "Chennai Super Kings", datetime.now().isoformat(),
              "live", 0, 0, 0, 0, 0.0, 0.0, 1))
    else:
        match_id = match[0]
        print(f"Using existing live match: {match_id}")
    
    # Sample ball data for testing
    sample_balls = [
        # Over 1
        {"over": 1, "ball": 1, "batsman": "Rohit Sharma", "bowler": "Deepak Chahar", "runs": 0, "extras": 0, "extras_type": None, "wicket": 0, "wicket_type": None, "wicket_player": None, "commentary": "Good length delivery, defended back to the bowler"},
        {"over": 1, "ball": 2, "batsman": "Rohit Sharma", "bowler": "Deepak Chahar", "runs": 4, "extras": 0, "extras_type": None, "wicket": 0, "wicket_type": None, "wicket_player": None, "commentary": "Beautiful cover drive! Rohit times it perfectly and finds the boundary"},
        {"over": 1, "ball": 3, "batsman": "Rohit Sharma", "bowler": "Deepak Chahar", "runs": 1, "extras": 0, "extras_type": None, "wicket": 0, "wicket_type": None, "wicket_player": None, "commentary": "Worked away to mid-wicket for a single"},
        {"over": 1, "ball": 4, "batsman": "Ishan Kishan", "bowler": "Deepak Chahar", "runs": 2, "extras": 0, "extras_type": None, "wicket": 0, "wicket_type": None, "wicket_player": None, "commentary": "Nicely placed behind square, they come back for the second"},
        {"over": 1, "ball": 5, "batsman": "Ishan Kishan", "bowler": "Deepak Chahar", "runs": 0, "extras": 0, "extras_type": None, "wicket": 0, "wicket_type": None, "wicket_player": None, "commentary": "Beats the bat! Excellent delivery from Chahar"},
        {"over": 1, "ball": 6, "batsman": "Ishan Kishan", "bowler": "Deepak Chahar", "runs": 0, "extras": 1, "extras_type": "wide", "wicket": 0, "wicket_type": None, "wicket_player": None, "commentary": "Wide down the leg side, pressure showing"},
        {"over": 1, "ball": 7, "batsman": "Ishan Kishan", "bowler": "Deepak Chahar", "runs": 6, "extras": 0, "extras_type": None, "wicket": 0, "wicket_type": None, "wicket_player": None, "commentary": "BOOM! Ishan Kishan launches it over mid-wicket for a massive six!"},
        
        # Over 2
        {"over": 2, "ball": 1, "batsman": "Rohit Sharma", "bowler": "Tushar Deshpande", "runs": 0, "extras": 0, "extras_type": None, "wicket": 0, "wicket_type": None, "wicket_player": None, "commentary": "Good start from Deshpande, Rohit blocks it solidly"},
        {"over": 2, "ball": 2, "batsman": "Rohit Sharma", "bowler": "Tushar Deshpande", "runs": 0, "extras": 0, "extras_type": None, "wicket": 1, "wicket_type": "bowled", "wicket_player": "Rohit Sharma", "commentary": "BOWLED! What a delivery! Deshpande gets through Rohit's defense and crashes into the stumps!"},
        {"over": 2, "ball": 3, "batsman": "Suryakumar Yadav", "bowler": "Tushar Deshpande", "runs": 1, "extras": 0, "extras_type": None, "wicket": 0, "wicket_type": None, "wicket_player": None, "commentary": "Suryakumar gets off the mark with a quick single to third man"},
        {"over": 2, "ball": 4, "batsman": "Ishan Kishan", "bowler": "Tushar Deshpande", "runs": 4, "extras": 0, "extras_type": None, "wicket": 0, "wicket_type": None, "wicket_player": None, "commentary": "Cracking shot! Kishan drives on the up and pierces the gap at covers"},
        {"over": 2, "ball": 5, "batsman": "Ishan Kishan", "bowler": "Tushar Deshpande", "runs": 0, "extras": 0, "extras_type": None, "wicket": 0, "wicket_type": None, "wicket_player": None, "commentary": "Slower ball, Kishan is early into the shot and misses"},
        {"over": 2, "ball": 6, "batsman": "Ishan Kishan", "bowler": "Tushar Deshpande", "runs": 0, "extras": 2, "extras_type": "bye", "wicket": 0, "wicket_type": None, "wicket_player": None, "commentary": "Beats everyone! The ball bounces awkwardly and they steal two byes"},
    ]
    
    # Add balls to database
    for ball in sample_balls:
        ball_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO balls (id, match_id, innings, over_number, ball_number, 
                             batsman, bowler, runs, extras, extras_type, wicket, 
                             wicket_type, wicket_player, commentary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (ball_id, match_id, 1, ball["over"], ball["ball"], ball["batsman"], 
              ball["bowler"], ball["runs"], ball["extras"], ball["extras_type"],
              ball["wicket"], ball["wicket_type"], ball["wicket_player"], ball["commentary"]))
    
    conn.commit()
    conn.close()
    
    print(f"Added {len(sample_balls)} sample balls to match {match_id}")
    print("You can now view the Cricinfo-style commentary in the web interface!")

if __name__ == "__main__":
    add_sample_balls()
