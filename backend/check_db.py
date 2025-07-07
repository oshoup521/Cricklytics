import sqlite3

conn = sqlite3.connect('cricklytics.db')
cursor = conn.cursor()

# Check if match_state table exists
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='match_state';")
table_exists = cursor.fetchone()
print('match_state table exists:', bool(table_exists))

if not table_exists:
    print('Creating match_state table...')
    cursor.execute("""
        CREATE TABLE match_state (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            match_id TEXT NOT NULL,
            current_striker TEXT,
            current_non_striker TEXT,
            current_bowler TEXT,
            on_strike TEXT DEFAULT 'striker',
            current_innings INTEGER DEFAULT 1,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (match_id) REFERENCES matches (id)
        )
    """)
    conn.commit()
    print('Table created successfully!')
else:
    cursor.execute('PRAGMA table_info(match_state)')
    print('Table structure:')
    for row in cursor.fetchall():
        print(row)

conn.close()
print('Database check complete!')
