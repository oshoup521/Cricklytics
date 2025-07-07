#!/usr/bin/env python3
"""
Script to clear all match data while preserving teams
"""

import sqlite3
import os

def clear_match_data():
    """Clear all match-related data but keep teams"""
    db_path = 'cricklytics.db'
    
    if not os.path.exists(db_path):
        print("Database file not found!")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("Clearing match data while preserving teams...")
        
        # Clear all tables except standalone_teams
        tables_to_clear = [
            'balls',
            'match_state', 
            'team_match_usage',
            'teams',  # This is match-specific teams, not standalone teams
            'matches'
        ]
        
        for table in tables_to_clear:
            cursor.execute(f"DELETE FROM {table}")
            rows_deleted = cursor.rowcount
            print(f"Deleted {rows_deleted} rows from {table}")
        
        # Reset auto-increment counters if they exist
        try:
            cursor.execute("DELETE FROM sqlite_sequence WHERE name IN ('balls', 'matches', 'teams', 'match_state', 'team_match_usage')")
        except sqlite3.OperationalError:
            # sqlite_sequence table doesn't exist, which is fine
            pass
        
        conn.commit()
        print("\n✅ Successfully cleared all match data!")
        print("📋 Standalone teams data has been preserved.")
        
        # Show remaining data
        cursor.execute("SELECT COUNT(*) FROM standalone_teams")
        team_count = cursor.fetchone()[0]
        print(f"📊 Remaining standalone teams: {team_count}")
        
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        print(f"👥 Remaining users: {user_count}")
        
    except Exception as e:
        print(f"❌ Error clearing data: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    clear_match_data()
