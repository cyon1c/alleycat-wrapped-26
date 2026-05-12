import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import type { GlobalStats, PlayerSummary, PlayerDetail, PlayerMatch } from "./types";

const dataDir = path.join(process.cwd(), "data");

function readJson<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

export function getGlobalStats(): GlobalStats {
  return readJson<GlobalStats>(path.join(dataDir, "global.json"));
}

export function getAllPlayers(): PlayerSummary[] {
  return readJson<PlayerSummary[]>(path.join(dataDir, "index.json"));
}

export function getPlayer(id: string): PlayerDetail | null {
  const filePath = path.join(dataDir, "players", `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  return readJson<PlayerDetail>(filePath);
}

export function getAllPlayerIds(): string[] {
  const dir = path.join(dataDir, "players");
  return fs.readdirSync(dir).map((f) => f.replace(".json", ""));
}

export function getPlayerMatches(playerId: string): PlayerMatch[] {
  const raw = fs.readFileSync(path.join(dataDir, "matches.csv"), "utf-8");
  const rows = parse(raw, { columns: true, skip_empty_lines: true }) as Record<string, string>[];

  // Build a name map from index for opponent lookup
  const index = getAllPlayers();
  const nameMap = new Map(index.map((p) => [p.id, p.name]));

  const matches: PlayerMatch[] = [];
  for (const row of rows) {
    const isHunter = row.hunter === playerId;
    const isBounty = row.bounty === playerId;
    if (!isHunter && !isBounty) continue;

    const opponentId = isHunter ? row.bounty : row.hunter;
    const myTime = isHunter ? parseFloat(row.hunter_time) : parseFloat(row.bounty_time);
    const oppTime = isHunter ? parseFloat(row.bounty_time) : parseFloat(row.hunter_time);
    const hunterWon = row.winner_is_hunter === "1";
    const won = isHunter ? hunterWon : !hunterWon;

    matches.push({
      rowid: parseInt(row.rowid),
      matchId: row.match_id,
      role: isHunter ? "hunter" : "bounty",
      opponentId,
      opponentName: nameMap.get(opponentId) ?? opponentId,
      myTime: isNaN(myTime) ? null : myTime,
      opponentTime: isNaN(oppTime) ? null : oppTime,
      won,
    });
  }

  return matches.sort((a, b) => a.rowid - b.rowid);
}
