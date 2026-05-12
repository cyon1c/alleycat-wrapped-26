export type Role = "hunter" | "bounty";

export interface PlayerMatch {
  rowid: number;
  matchId: string;
  role: Role;
  opponentId: string;
  opponentName: string;
  myTime: number | null;
  opponentTime: number | null;
  won: boolean;
}

export interface PlayerSummary {
  id: string;
  name: string;
  role: Role;
  faction: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  globalRank: number | null;
  roleRank: number | null;
  avgTime: number | null;
  fastestTime: number | null;
}

export interface TopOpponent {
  id: string;
  name: string;
  wins: number;
  losses: number;
  totalMatches: number;
}

export interface StreakInfo {
  type: "win" | "loss";
  count: number;
}

export interface PlayerDetail {
  id: string;
  name: string;
  role: Role;
  faction: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  avgTime: number | null;
  fastestTime: number | null;
  slowestTime: number | null;
  totalTimeSeconds: number | null;
  longestWinStreak: number;
  longestLossStreak: number;
  currentStreak: StreakInfo;
  uniqueOpponents: number;
  nemesis: { id: string; name: string; lossesTo: number } | null;
  prey: { id: string; name: string; winsAgainst: number } | null;
  rival: { id: string; name: string; totalMatches: number } | null;
  topOpponents: TopOpponent[];
  performanceArc: { earlyWinRate: number; lateWinRate: number } | null;
  escapeRate: number | null;
  avgMarginOfVictory: number | null;
  globalRank: number | null;
  roleRank: number | null;
}

export interface FastestTimeEntry {
  matchId: string;
  hunterId?: string;
  hunterName?: string;
  hunterTime?: number;
  bountyId?: string;
  bountyName?: string;
  bountyTime?: number;
}

export interface ClosestMatch {
  matchId: string;
  rowid: number;
  margin: number;
  hunterId: string;
  hunterName: string;
  bountyId: string;
  bountyName: string;
  hunterTime: number;
  bountyTime: number;
}

export interface TopPlayerEntry {
  playerId: string;
  name: string;
  totalMatches?: number;
  streak?: number;
  uniqueOpponents?: number;
}

export interface AnomalousMatch {
  matchId: string;
  rowid: number;
  hunterId: string;
  hunterName: string;
  bountyId: string;
  bountyName: string;
  hunterTime: number;
  bountyTime: number;
  hunterReactionTimeInsane: boolean;
  bountyReactionTimeInsane: boolean;
  insanePlayersSummary: string;
  winnerIsHunter: boolean;
}

export interface FastestAvgEntry {
  playerId: string;
  name: string;
  avgTime: number;
}

export interface GlobalStats {
  totalMatches: number;
  totalPlayersRegistered: number;
  totalPlayersActive: number;
  totalHuntersActive: number;
  totalBountiesActive: number;
  hunterWinRate: number;
  bountyWinRate: number;
  avgHunterTime: number;
  avgBountyTime: number;
  avgWinStreak: number;
  avgLossStreak: number;
  top3FastestHunterTimes: FastestTimeEntry[];
  top3FastestBountyTimes: FastestTimeEntry[];
  top3ClosestMatches: ClosestMatch[];
  top10MostMatchesPlayed: TopPlayerEntry[];
  top10LongestWinStreaks: TopPlayerEntry[];
  top10MostUniqueOpponents: TopPlayerEntry[];
  top10FastestAvgTimes: FastestAvgEntry[];
  matchCountPercentiles: { p25: number; p50: number; p75: number; p90: number; p99: number };
  totalMatchSeconds: number;
  anomalousMatches: AnomalousMatch[];
  maxSaneTimeSeconds: number;
  minRankedMatches: number;
  excludesZeroReactionTimesFromTimeStats: boolean;
}
