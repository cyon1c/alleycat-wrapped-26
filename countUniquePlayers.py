import csv

MATCHES_CSV = r"csv-exports\matches.csv"

playerIds = set()

with open(MATCHES_CSV, newline="", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        playerIds.add(row["hunter"])
        playerIds.add(row["bounty"])

print(f"Unique player IDs in matches: {len(playerIds)}")
