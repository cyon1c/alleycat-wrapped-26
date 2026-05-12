import Image from "next/image";
import Link from "next/link";
import { getGlobalStats, getAllPlayers } from "@/lib/data";
import { formatTime, formatPct, formatNumber, formatDuration } from "@/lib/utils";
import StatCard from "@/components/statCard";
import LeaderboardCard from "@/components/leaderboardCard";

export default function HomePage() {
  const g = getGlobalStats();
  const allPlayers = getAllPlayers();

  const totalReactionTime = formatDuration(g.totalMatchSeconds);
  const avgReactionTime = formatTime((g.avgHunterTime + g.avgBountyTime) / 2);

  const hunters = allPlayers
    .filter((p) => p.role === "hunter" && p.wins > 0)
    .sort((a, b) => b.wins - a.wins);

  const bounties = allPlayers
    .filter((p) => p.role === "bounty" && p.wins > 0)
    .sort((a, b) => b.wins - a.wins);

  return (
    <div>
      {/* Hero */}
      <section className="relative grid-bg border-b border-[var(--border)] overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="Alleycat"
            width={120}
            height={120}
            className="mb-6 glitch"
            priority
          />
          <h1 className="font-headline text-5xl md:text-7xl tracking-wider text-[var(--cyan)] glow-cyan mb-2">
            WRAPPED
          </h1>
          <p className="font-sub text-lg md:text-2xl text-[var(--text-dim)] tracking-[0.3em] mb-2">
            ALLEYCAT &apos;26
          </p>
          <Link
            href="/players"
            className="font-sub mt-8 px-8 py-3 border border-[var(--cyan)] text-[var(--cyan)] text-sm tracking-widest hover:bg-[var(--cyan)]/10 transition-all duration-200"
          >
            FIND YOUR STATS →
          </Link>
        </div>
        <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-[var(--cyan)]/40" />
        <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-[var(--cyan)]/40" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b border-l border-[var(--cyan)]/40" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-[var(--cyan)]/40" />
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">

        {/* Key numbers */}
        <section>
          <SectionLabel>{"// EVENT OVERVIEW"}</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <StatCard label="Total Matches" value={formatNumber(g.totalMatches)} accent="cyan" />
            <StatCard label="Active Assets" value={formatNumber(g.totalPlayersActive)} accent="pink" />
            <StatCard label="Total Reaction Time" value={totalReactionTime} sub="combined across all matches" accent="green" />
            <StatCard label="Avg Reaction Time" value={avgReactionTime} accent="cyan" />
          </div>
        </section>

        {/* Hunter vs Bounty */}
        <section>
          <SectionLabel>{"// HUNTER VS BOUNTY"}</SectionLabel>

          {/* Ranked lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <RankedList title="Hunters" players={hunters} accent="cyan" />
            <RankedList title="Bounties" players={bounties} accent="pink" />
          </div>

          {/* Win rate breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="card cyber-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-alt text-xs tracking-widest text-[var(--text-dim)] uppercase">Hunters</p>
                  <p className="font-callout text-4xl text-[var(--cyan)] glow-cyan mt-1">
                    {formatPct(g.hunterWinRate)}
                  </p>
                  <p className="font-body text-sm text-[var(--text-dim)] mt-1">win rate · {g.totalHuntersActive} active</p>
                </div>
                <div className="text-right">
                  <p className="font-alt text-sm tracking-widest text-[var(--text-dim)] uppercase">Avg Reaction Time</p>
                  <p className="font-callout text-2xl text-[var(--cyan)] mt-1">{formatTime(g.avgHunterTime)}</p>
                </div>
              </div>
              <WinRateBar rate={g.hunterWinRate} color="cyan" />
            </div>

            <div className="card cyber-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-alt text-xs tracking-widest text-[var(--text-dim)] uppercase">Bounties</p>
                  <p className="font-callout text-4xl text-[var(--pink)] glow-pink mt-1">
                    {formatPct(g.bountyWinRate)}
                  </p>
                  <p className="font-body text-sm text-[var(--text-dim)] mt-1">escape rate · {g.totalBountiesActive} active</p>
                </div>
                <div className="text-right">
                  <p className="font-alt text-sm tracking-widest text-[var(--text-dim)] uppercase">Avg Reaction Time</p>
                  <p className="font-callout text-2xl text-[var(--pink)] mt-1">{formatTime(g.avgBountyTime)}</p>
                </div>
              </div>
              <WinRateBar rate={g.bountyWinRate} color="pink" />
            </div>
          </div>
        </section>

        {/* Leaderboards */}
        <section>
          <SectionLabel>{"// LEADERBOARDS"}</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <LeaderboardCard
              title="Most Unique Opponents"
              accent="cyan"
              entries={g.top10MostUniqueOpponents.map((p, i) => ({
                rank: i + 1,
                playerId: p.playerId,
                name: p.name,
                value: formatNumber(p.uniqueOpponents ?? 0),
                valueLabel: "opponents",
              }))}
            />
            <LeaderboardCard
              title="Longest Win Streak"
              accent="pink"
              entries={g.top10LongestWinStreaks.map((p, i) => ({
                rank: i + 1,
                playerId: p.playerId,
                name: p.name,
                value: formatNumber(p.streak ?? 0),
                valueLabel: "streak",
              }))}
            />
            <LeaderboardCard
              title="Fastest Avg Reaction Time"
              accent="green"
              entries={g.top10FastestAvgTimes.map((p, i) => ({
                rank: i + 1,
                playerId: p.playerId,
                name: p.name,
                value: formatTime(p.avgTime),
              }))}
            />
            <LeaderboardCard
              title="Most Matches Played"
              accent="cyan"
              entries={g.top10MostMatchesPlayed.map((p, i) => ({
                rank: i + 1,
                playerId: p.playerId,
                name: p.name,
                value: formatNumber(p.totalMatches ?? 0),
                valueLabel: "matches",
              }))}
            />
          </div>
        </section>

        {/* Fastest times */}
        <section>
          <SectionLabel>{"// FASTEST REACTION TIMES"}</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="card cyber-border p-5">
              <h3 className="font-sub text-sm tracking-widest uppercase text-[var(--text-dim)] mb-4">Top Hunter Times</h3>
              <div className="space-y-3">
                {g.top3FastestHunterTimes.map((entry, i) => (
                  <div key={entry.matchId + i} className="flex items-center gap-3">
                    <span className="font-callout text-base text-[var(--cyan)] w-7">#{i + 1}</span>
                    <Link
                      href={`/players/${entry.hunterId}`}
                      className="font-body flex-1 text-base text-[var(--text)] hover:text-[var(--cyan)] transition-colors"
                    >
                      {entry.hunterName}
                    </Link>
                    <span className="font-callout text-base text-[var(--cyan)] glow-cyan">
                      {formatTime(entry.hunterTime)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card cyber-border p-5">
              <h3 className="font-sub text-sm tracking-widest uppercase text-[var(--text-dim)] mb-4">Top Bounty Times</h3>
              <div className="space-y-3">
                {g.top3FastestBountyTimes.map((entry, i) => (
                  <div key={entry.matchId + i} className="flex items-center gap-3">
                    <span className="font-callout text-base text-[var(--pink)] w-7">#{i + 1}</span>
                    <Link
                      href={`/players/${entry.bountyId}`}
                      className="font-body flex-1 text-base text-[var(--text)] hover:text-[var(--pink)] transition-colors"
                    >
                      {entry.bountyName}
                    </Link>
                    <span className="font-callout text-base text-[var(--pink)] glow-pink">
                      {formatTime(entry.bountyTime)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Closest matches */}
        <section>
          <SectionLabel>{"// CLOSEST MATCHES"}</SectionLabel>
          <div className="card cyber-border mt-4 divide-y divide-[var(--border)]">
            {g.top3ClosestMatches.map((match, i) => (
              <div key={match.matchId} className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                <span className="font-callout text-base text-[var(--green)] w-7">#{i + 1}</span>
                <div className="flex-1 flex flex-wrap items-center gap-2">
                  <Link href={`/players/${match.hunterId}`} className="font-body text-base text-[var(--cyan)] hover:underline">
                    {match.hunterName}
                  </Link>
                  <span className="font-alt text-sm text-[var(--text-dim)]">vs</span>
                  <Link href={`/players/${match.bountyId}`} className="font-body text-base text-[var(--pink)] hover:underline">
                    {match.bountyName}
                  </Link>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-callout text-sm text-[var(--green)] glow-green">
                    Δ {formatTime(match.margin)}
                  </p>
                  <p className="font-body text-[var(--text-dim)] text-xs mt-0.5">
                    {formatTime(match.hunterTime)} · {formatTime(match.bountyTime)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>


      </div>
    </div>
  );
}

interface RankedPlayer {
  id: string;
  name: string;
  wins: number;
  totalMatches: number;
  winRate: number;
}

function RankedList({ title, players, accent }: { title: string; players: RankedPlayer[]; accent: "cyan" | "pink" }) {
  const accentClass = accent === "cyan" ? "text-[var(--cyan)]" : "text-[var(--pink)]";
  const barClass = accent === "cyan" ? "bg-[var(--cyan)]" : "bg-[var(--pink)]";
  const maxWins = players[0]?.wins ?? 1;

  return (
    <div className={`card cyber-border flex flex-col`} style={{ height: "480px" }}>
      <div className="px-5 pt-5 pb-3 shrink-0">
        <h3 className={`font-sub text-sm tracking-widest uppercase ${accentClass}`}>{title}</h3>
        <p className="font-body text-xs text-[var(--text-dim)] mt-1">{players.length} assets · ranked by wins</p>
      </div>
      <div className="overflow-y-auto flex-1 px-2 pb-3">
        {players.map((p, i) => (
          <Link
            key={p.id}
            href={`/players/${p.id}`}
            className={`flex items-center gap-3 px-3 py-2.5 border-b border-[var(--border)]/40 hover:bg-white/[0.03] group transition-colors last:border-0`}
          >
            <span className={`font-callout text-sm w-8 shrink-0 ${i < 3 ? accentClass : "text-[var(--text-dim)]"}`}>
              #{i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm text-[var(--text)] group-hover:text-white transition-colors truncate">
                {p.name}
              </p>
              <div className="mt-1 h-0.5 bg-white/5 rounded-full overflow-hidden w-full">
                <div
                  className={`h-full ${barClass} rounded-full`}
                  style={{ width: `${(p.wins / maxWins) * 100}%`, opacity: 0.6 }}
                />
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className={`font-callout text-sm ${accentClass}`}>{p.wins}</span>
              <span className="font-body text-xs text-[var(--text-dim)] ml-1">W</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-sub text-sm tracking-widest text-[var(--cyan)] border-b border-[var(--border)] pb-2">
      {children}
    </h2>
  );
}

function WinRateBar({ rate, color }: { rate: number; color: "cyan" | "pink" }) {
  const colorClass = color === "cyan" ? "bg-[var(--cyan)]" : "bg-[var(--pink)]";
  return (
    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
      <div
        className={`h-full ${colorClass} rounded-full transition-all duration-1000`}
        style={{ width: `${rate * 100}%` }}
      />
    </div>
  );
}
