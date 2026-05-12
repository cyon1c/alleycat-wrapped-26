import csv
from collections import Counter

MATCHES_CSV = r"csv-exports\matches.csv"
OUTPUT_FILE = "match-distribution.md"

matchCounts = Counter()
with open(MATCHES_CSV, newline="", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        matchCounts[row["hunter"]] += 1
        matchCounts[row["bounty"]] += 1


def buildTable(matchCounts, bucketFn, labelFn):
    buckets = Counter()
    for count in matchCounts.values():
        buckets[bucketFn(count)] += 1
    rows = []
    for bucket in sorted(buckets):
        rows.append(f"| {labelFn(bucket)} | {buckets[bucket]} |")
    return rows


def detailedBucket(count):
    if count < 50:
        return ((count - 1) // 10) * 10 + 1
    else:
        return (count // 50) * 50

def detailedLabel(bucket):
    if bucket < 50:
        return f"{bucket}-{bucket + 9}"
    else:
        return f"{bucket}-{bucket + 49}"


def condensedBucket(count):
    if count < 100:
        return (count // 50) * 50
    else:
        return (count // 100) * 100

def condensedLabel(bucket):
    if bucket < 100:
        return f"{bucket}-{bucket + 49}"
    else:
        return f"{bucket}-{bucket + 99}"


detailedRows = buildTable(matchCounts, detailedBucket, detailedLabel)
condensedRows = buildTable(matchCounts, condensedBucket, condensedLabel)

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write("# Match Distribution Report\n\n")

    f.write("## Detailed (buckets of 10 up to 50, then 50)\n\n")
    f.write("| # Matches | # Players |\n")
    f.write("|---|---|\n")
    f.write("\n".join(detailedRows))
    f.write("\n\n")

    f.write("## Condensed (buckets of 50 up to 100, then 100)\n\n")
    f.write("| # Matches | # Players |\n")
    f.write("|---|---|\n")
    f.write("\n".join(condensedRows))
    f.write("\n")

print(f"Written to {OUTPUT_FILE}")
