#!/usr/bin/env python3
"""
Database cleanup script to remove dummy/test data from Cricklytics
"""

import sqlite3
import sys
from datetime import datetime

def cleanup_database():
    """Clean up test and dummy data from the database"""
    
    try:
        conn = sqlite3.connect('cricklytics.db')
        cursor = conn.cursor()
        
        print("🧹 Starting database cleanup...")
        
        # Get current data counts
        cursor.execute("SELECT COUNT(*) FROM matches")
        initial_matches = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM users")
        initial_users = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM balls")
        initial_balls = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM teams")
        initial_teams = cursor.fetchone()[0]
        
        print(f"📊 Initial counts:")
        print(f"   Matches: {initial_matches}")
        print(f"   Users: {initial_users}")
        print(f"   Balls: {initial_balls}")
        print(f"   Teams: {initial_teams}")
        
        # List of test/dummy match patterns to remove
        test_patterns = [
            'test%',
            'Test%',
            'dummy%',
            'Dummy%',
            'sample%',
            'Sample%',
            'Standalone Teams'
        ]
        
        # List of test/dummy user patterns to remove
        test_users = [
            'testuser',
            'demo_user',
            'test%',
            'demo%',
            'sample%'
        ]
        
        # Get matches to delete
        matches_to_delete = []
        for pattern in test_patterns:
            cursor.execute("SELECT id, name FROM matches WHERE name LIKE ?", (pattern,))
            matches = cursor.fetchall()
            matches_to_delete.extend(matches)
        
        # Get users to delete
        users_to_delete = []
        for pattern in test_users:
            cursor.execute("SELECT id, username FROM users WHERE username LIKE ?", (pattern,))
            users = cursor.fetchall()
            users_to_delete.extend(users)
        
        if matches_to_delete or users_to_delete:
            print(f"\n🗑️  Found data to clean:")
            
            if matches_to_delete:
                print(f"   Matches to delete ({len(matches_to_delete)}):")
                for match_id, name in matches_to_delete:
                    print(f"     - {name} (ID: {match_id})")
            
            if users_to_delete:
                print(f"   Users to delete ({len(users_to_delete)}):")
                for user_id, username in users_to_delete:
                    print(f"     - {username} (ID: {user_id})")
            
            # Ask for confirmation
            confirm = input("\n❓ Do you want to proceed with cleanup? (y/N): ").strip().lower()
            
            if confirm in ['y', 'yes']:
                print("\n🧽 Cleaning up data...")
                
                # Delete related data first (foreign key constraints)
                if matches_to_delete:
                    match_ids = [match[0] for match in matches_to_delete]
                    
                    # Delete balls for these matches
                    for match_id in match_ids:
                        cursor.execute("DELETE FROM balls WHERE match_id = ?", (match_id,))
                    
                    # Delete matches
                    for match_id in match_ids:
                        cursor.execute("DELETE FROM matches WHERE id = ?", (match_id,))
                
                # Delete users (but keep those referenced by remaining matches)
                cursor.execute("""
                    SELECT DISTINCT created_by FROM matches 
                    WHERE created_by IS NOT NULL AND created_by != ''
                """)
                referenced_users = {row[0] for row in cursor.fetchall()}
                
                for user_id, username in users_to_delete:
                    if user_id not in referenced_users:
                        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
                        print(f"     ✅ Deleted user: {username}")
                    else:
                        print(f"     ⚠️  Kept user {username} (referenced by matches)")
                
                # Clean up orphaned teams (teams not referenced by any matches)
                cursor.execute("""
                    DELETE FROM teams 
                    WHERE name NOT IN (
                        SELECT DISTINCT team1 FROM matches 
                        UNION 
                        SELECT DISTINCT team2 FROM matches
                    )
                """)
                
                conn.commit()
                
                # Get final counts
                cursor.execute("SELECT COUNT(*) FROM matches")
                final_matches = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM users")
                final_users = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM balls")
                final_balls = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM teams")
                final_teams = cursor.fetchone()[0]
                
                print(f"\n✅ Cleanup completed!")
                print(f"📊 Final counts:")
                print(f"   Matches: {final_matches} (removed {initial_matches - final_matches})")
                print(f"   Users: {final_users} (removed {initial_users - final_users})")
                print(f"   Balls: {final_balls} (removed {initial_balls - final_balls})")
                print(f"   Teams: {final_teams} (removed {initial_teams - final_teams})")
                
            else:
                print("❌ Cleanup cancelled")
        else:
            print("✨ No test/dummy data found to clean")
        
        # Additional cleanup: Reset match statuses to 'setup' for consistency
        cursor.execute("UPDATE matches SET status = 'setup' WHERE status != 'completed'")
        updated_statuses = cursor.rowcount
        
        if updated_statuses > 0:
            conn.commit()
            print(f"🔄 Reset {updated_statuses} match statuses to 'setup'")
        
        conn.close()
        print("\n🎉 Database cleanup process completed!")
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n⚠️  Cleanup interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    cleanup_database()
