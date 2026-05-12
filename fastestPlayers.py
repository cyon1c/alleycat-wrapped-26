import csv
from collections import Counter, defaultdict

matchCounts = Counter()
times = defaultdict(list)

with open(r"csv-exports\matches.csv", newline="", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        matchCounts[row["hunter"]] += 1
        matchCounts[row["bounty"]] += 1
        if row["hunter_time"]:
            times[row["hunter"]].append(float(row["hunter_time"]))
        if row["bounty_time"]:
            times[row["bounty"]].append(float(row["bounty_time"]))

players = {}
with open(r"csv-exports\players.csv", newline="", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        players[row["id"]] = row["name"]

active = {pid for pid in matchCounts if matchCounts[pid] > 30}
avgs = {pid: sum(times[pid]) / len(times[pid]) for pid in active if times[pid]}

top10 = sorted(avgs, key=lambda p: avgs[p])[:10]

header = f"{'Name':<20} {'Avg Time':>12} {'Matches':>10}"
print(header)
print("-" * len(header))
for pid in top10:
    name = players.get(pid, pid)
    print(f"{name:<20} {avgs[pid]:>12.2f} {matchCounts[pid]:>10}")
