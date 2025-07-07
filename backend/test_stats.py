import requests

# Test the statistics API
match_id = "c994d4a7-890c-49e8-ad62-e1d1f2e83c10"

try:
    response = requests.get(f"http://localhost:8000/api/matches/{match_id}/statistics")
    if response.status_code == 200:
        data = response.json()
        print("Statistics API response:")
        print(f"Total balls: {data.get('total_balls', 'N/A')}")
        
        bowling_stats = data.get('bowling_statistics', [])
        print(f"\nBowling Statistics:")
        for bowler in bowling_stats:
            print(f"  {bowler['name']}: {bowler['balls_bowled']} balls, {bowler['balls_bowled']/6:.1f} overs")
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"Error: {e}") 