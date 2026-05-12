import sqlite3
import csv
import os

DB_PATH = r"alleycat-26-final-results\db\alleycat.db"
OUTPUT_DIR = "csv-exports"

os.makedirs(OUTPUT_DIR, exist_ok=True)

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [row[0] for row in cur.fetchall()]

print(f"Found {len(tables)} tables: {tables}")

for table in tables:
    cur.execute(f"SELECT rowid, * FROM [{table}]")
    rows = cur.fetchall()
    col_names = ["rowid"] + [desc[0] for desc in cur.description][1:]

    out_path = os.path.join(OUTPUT_DIR, f"{table}.csv")
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(col_names)
        writer.writerows(rows)

    print(f"  Exported {table} -> {out_path} ({len(rows)} rows)")

conn.close()
print("Done.")
