import csv
from collections import Counter

MATCHES_CSV = r"csv-exports\matches.csv"

matchCounts = Counter()

with open(MATCHES_CSV, newline="", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        matchCounts[row["hunter"]] += 1
        matchCounts[row["bounty"]] += 1

distribution = Counter(matchCounts.values())

print(f"{'Matches':>10}  {'Players':>10}")
print("-" * 23)
for numMatches in sorted(distribution):
    print(f"{numMatches:>10}  {distribution[numMatches]:>10}")

print("-" * 23)
print(f"{'Total':>10}  {sum(distribution.values()):>10}")
