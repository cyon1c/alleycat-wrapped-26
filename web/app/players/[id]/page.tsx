import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlayer, getGlobalStats, getAllPlayerIds, getPlayerMatches } from "@/lib/data";
import { formatTime, formatPct, formatNumber, roleLabel, cn } from "@/lib/utils";
import StatCard from "@/components/statCard";
import { ArrowLeft, Swords, Shield, Zap } from "lucide-react";

export async function generateStaticParams() {
  const ids = getAllPlayerIds();
  return ids.map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const player = getPlayer(id);
  if (!player) return { title: "Asset Not Found" };
  return { title: `${player.name} // Alleycat Wrapped '26` };
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const player = getPlayer(id);
  if (!player) notFound();

  const global = getGlobalStats();
  const matches = getPlayerMatches(id);
  const isHunter = player.role === "hunter";
  const accentColor = isHunter ? "cyan" : "pink";
  const accentClass = isHunter ? "text-[var(--cyan)]" : "text-[var(--pink)]";
  const glowClass = isHunter ? "glow-cyan" : "glow-pink";
  const borderClass = isHunter ? "border-[var(--cyan)]/20" : "border-[var(--pink)]/20";

  const globalAvgTime = isHunter ? global.avgHunterTime : global.avgBountyTime;
  const globalWinRate = isHunter ? global.hunterWinRate : global.bountyWinRate;

  const timeVsAvg = player.avgTime != null ? player.avgTime - globalAvgTime : null;
  const winRateVsAvg = player.winRate - globalWinRate;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Back */}
      <Link
        href="/players"
        className="font-alt inline-flex items-center gap-2 text-sm text-[var(--text-dim)] hover:text-[var(--text)] mb-8 tracking-wider transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        BACK TO ASSETS
      </Link>

      {/* Player header */}
      <div className={cn("card cyber-border p-6 md:p-8 mb-8 relative overflow-hidden", borderClass)}>
        <div className={cn(
          "absolute inset-0 opacity-5",
          isHunter
            ? "bg-gradient-to-br from-cyan-500 to-transparent"
            : "bg-gradient-to-br from-pink-500 to-transparent"
        )} />

        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <div className={cn(
            "w-16 h-16 border flex items-center justify-center shrink-0",
            isHunter ? "border-[var(--cyan)]/40 bg-[var(--cyan)]/10" : "border-[var(--pink)]/40 bg-[var(--pink)]/10"
          )}>
            {isHunter
              ? <Swords className="w-8 h-8 text-[var(--cyan)]" />
              : <Shield className="w-8 h-8 text-[var(--pink)]" />
            }
          </div>

          <div className="flex-1">
            <p className={cn("font-alt text-sm tracking-widest uppercase mb-1", accentClass)}>{roleLabel(player.role)}</p>
            <h1 className={cn("font-headline text-3xl md:text-4xl", accentClass, glowClass)}>
              {player.name}
            </h1>
            {player.faction && (
              <p className="font-body text-[var(--text-dim)] text-sm mt-1">{player.faction}</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            {player.globalRank && (
              <div className="text-right">
                <p className="font-alt text-xs text-[var(--text-dim)] tracking-widest">GLOBAL RANK</p>
                <p className={cn("font-callout text-3xl", accentClass, glowClass)}>
                  #{player.globalRank}
                </p>
              </div>
            )}
            {player.roleRank && (
              <p className="font-body text-sm text-[var(--text-dim)]">
                {roleLabel(player.role)} rank #{player.roleRank}
              </p>
            )}
            {!player.globalRank && (
              <p className="font-body text-sm text-[var(--text-dim)] text-right">
                Unranked<br />
                <span className="text-xs">({global.minRankedMatches}+ matches to rank)</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Core stats */}
      <section className="mb-8">
        <SectionLabel>// COMBAT RECORD</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <StatCard label="Matches" value={formatNumber(player.totalMatches)} accent={accentColor} />
          <StatCard
            label="Win Rate"
            value={formatPct(player.winRate)}
            sub={`${player.wins}W · ${player.losses}L`}
            accent={player.winRate >= 0.5 ? "green" : "pink"}
          />
          <StatCard label="Avg Reaction Time" value={formatTime(player.avgTime)} accent={accentColor} />
          <StatCard label="Fastest Reaction" value={formatTime(player.fastestTime)} accent="green" />
        </div>
      </section>

      {/* Vs global comparison */}
      {player.totalMatches >= global.minRankedMatches && (
        <section className="mb-8">
          <SectionLabel>// VS FIELD AVERAGE</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <ComparisonBar
              label="Win Rate"
              playerVal={player.winRate}
              avgVal={globalWinRate}
              formatFn={formatPct}
              delta={winRateVsAvg}
              higherIsBetter
            />
            {timeVsAvg != null && (
              <ComparisonBar
                label="Reaction Time"
                playerVal={player.avgTime!}
                avgVal={globalAvgTime}
                formatFn={formatTime}
                delta={timeVsAvg}
                higherIsBetter={false}
              />
            )}
          </div>
        </section>
      )}

      {/* Streaks + Performance */}
      <section className="mb-8">
        <SectionLabel>// PERFORMANCE</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <StatCard label="Best Win Streak" value={player.longestWinStreak} accent="green" />
          <StatCard label="Worst Loss Streak" value={player.longestLossStreak} accent="pink" />
          <StatCard label="Unique Opponents" value={formatNumber(player.uniqueOpponents)} accent={accentColor} />
        </div>
      </section>

      {/* Performance arc */}
      {player.performanceArc && (
        <section className="mb-8">
          <SectionLabel>// PERFORMANCE ARC</SectionLabel>
          <div className="card cyber-border p-6 mt-4">
            <p className="font-body text-sm text-[var(--text-dim)] mb-6">
              Did you peak early or finish strong? Early = first half of matches · Late = second half.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="font-alt text-sm tracking-widest text-[var(--text-dim)] uppercase mb-2">Early Game</p>
                <p className={cn("font-callout text-3xl", accentClass, glowClass)}>
                  {formatPct(player.performanceArc.earlyWinRate)}
                </p>
                <WinRateBar rate={player.performanceArc.earlyWinRate} color={isHunter ? "cyan" : "pink"} />
              </div>
              <div>
                <p className="font-alt text-sm tracking-widest text-[var(--text-dim)] uppercase mb-2">Late Game</p>
                <p className={cn("font-callout text-3xl", accentClass, glowClass)}>
                  {formatPct(player.performanceArc.lateWinRate)}
                </p>
                <WinRateBar rate={player.performanceArc.lateWinRate} color={isHunter ? "cyan" : "pink"} />
                <p className="font-body text-sm mt-2">
                  {player.performanceArc.lateWinRate > player.performanceArc.earlyWinRate
                    ? <span className="text-[var(--green)]">▲ Improved late</span>
                    : player.performanceArc.lateWinRate < player.performanceArc.earlyWinRate
                    ? <span className="text-[var(--pink)]">▼ Faded late</span>
                    : <span className="text-[var(--text-dim)]">= Consistent</span>
                  }
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Nemesis / Prey / Rival */}
      {(player.nemesis || player.prey || player.rival) && (
        <section className="mb-8">
          <SectionLabel>// RELATIONSHIPS</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            {player.nemesis && (
              <RelCard
                title="Nemesis"
                subtitle={`Lost ${player.nemesis.lossesTo}× to`}
                name={player.nemesis.name}
                href={`/players/${player.nemesis.id}`}
                accent="pink"
                icon={<Swords className="w-4 h-4" />}
              />
            )}
            {player.prey && (
              <RelCard
                title="Prey"
                subtitle={`Defeated ${player.prey.winsAgainst}×`}
                name={player.prey.name}
                href={`/players/${player.prey.id}`}
                accent="green"
                icon={<Zap className="w-4 h-4" />}
              />
            )}
            {player.rival && (
              <RelCard
                title="Rival"
                subtitle={`${player.rival.totalMatches} clashes`}
                name={player.rival.name}
                href={`/players/${player.rival.id}`}
                accent={accentColor}
                icon={<Shield className="w-4 h-4" />}
              />
            )}
          </div>
        </section>
      )}

      {/* Top opponents */}
      {player.topOpponents.length > 0 && (
        <section className="mb-8">
          <SectionLabel>// TOP OPPONENTS</SectionLabel>
          <div className="card cyber-border mt-4 divide-y divide-[var(--border)]">
            <div className="grid grid-cols-4 px-4 py-2 text-xs tracking-widest text-[var(--text-dim)] uppercase">
              <span className="font-alt">Opponent</span>
              <span className="font-alt text-center">W</span>
              <span className="font-alt text-center">L</span>
              <span className="font-alt text-right">Total</span>
            </div>
            {player.topOpponents.map((opp) => {
              const oppWinRate = opp.totalMatches > 0 ? opp.wins / opp.totalMatches : 0;
              return (
                <Link
                  key={opp.id}
                  href={`/players/${opp.id}`}
                  className="grid grid-cols-4 px-4 py-3 hover:bg-white/[0.02] transition-colors group"
                >
                  <span className="font-body text-base text-[var(--text)] group-hover:text-white transition-colors truncate pr-2">
                    {opp.name}
                  </span>
                  <span className="font-callout text-center text-base text-[var(--green)]">{opp.wins}</span>
                  <span className="font-callout text-center text-base text-[var(--pink)]">{opp.losses}</span>
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden hidden md:block">
                      <div
                        className="h-full bg-[var(--green)] rounded-full"
                        style={{ width: `${oppWinRate * 100}%` }}
                      />
                    </div>
                    <span className="font-callout text-sm text-[var(--text-dim)]">{opp.totalMatches}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Extra stats */}
      <section className="mb-8">
        <SectionLabel>// EXTRA DATA</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          {player.avgMarginOfVictory != null && (
            <StatCard label="Avg Victory Margin" value={formatTime(player.avgMarginOfVictory)} accent={accentColor} />
          )}
          {player.slowestTime != null && (
            <StatCard label="Slowest Reaction" value={formatTime(player.slowestTime)} accent="pink" />
          )}
          {player.escapeRate != null && (
            <StatCard label="Escape Rate" value={formatPct(player.escapeRate)} accent="green" />
          )}
        </div>
      </section>

      {/* Match history */}
      {matches.length > 0 && (
        <section className="mb-8">
          <SectionLabel>// MATCH HISTORY</SectionLabel>
          <div className="card cyber-border mt-4" style={{ height: "480px", display: "flex", flexDirection: "column" }}>
            {/* Table header */}
            <div className="grid grid-cols-[3rem_1fr_7rem_7rem_4rem] gap-2 px-4 py-3 border-b border-[var(--border)] shrink-0">
              <span className="font-alt text-xs text-[var(--text-dim)] tracking-widest uppercase">#</span>
              <span className="font-alt text-xs text-[var(--text-dim)] tracking-widest uppercase">Opponent</span>
              <span className="font-alt text-xs text-[var(--text-dim)] tracking-widest uppercase text-right">My Time</span>
              <span className="font-alt text-xs text-[var(--text-dim)] tracking-widest uppercase text-right">Their Time</span>
              <span className="font-alt text-xs text-[var(--text-dim)] tracking-widest uppercase text-right">Result</span>
            </div>
            {/* Scrollable rows */}
            <div className="overflow-y-auto flex-1">
              {matches.map((match, i) => (
                <div
                  key={match.matchId}
                  className="grid grid-cols-[3rem_1fr_7rem_7rem_4rem] gap-2 px-4 py-2.5 border-b border-[var(--border)]/40 hover:bg-white/[0.02] last:border-0"
                >
                  <span className="font-callout text-sm text-[var(--text-dim)]/60">{i + 1}</span>
                  <Link
                    href={`/players/${match.opponentId}`}
                    className="font-body text-sm text-[var(--text)] hover:text-white transition-colors truncate"
                  >
                    {match.opponentName}
                  </Link>
                  <span className={cn(
                    "font-callout text-sm text-right",
                    match.myTime != null && match.myTime <= 1000 ? accentClass : "text-[var(--text-dim)]"
                  )}>
                    {formatTime(match.myTime)}
                  </span>
                  <span className="font-callout text-sm text-right text-[var(--text-dim)]">
                    {formatTime(match.opponentTime)}
                  </span>
                  <span className={cn(
                    "font-callout text-sm text-right",
                    match.won ? "text-[var(--green)]" : "text-[var(--pink)]"
                  )}>
                    {match.won ? "W" : "L"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="font-body text-xs text-[var(--text-dim)] mt-2">{matches.length} matches total</p>
        </section>
      )}
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
    <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-2">
      <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${rate * 100}%` }} />
    </div>
  );
}

interface ComparisonBarProps {
  label: string;
  playerVal: number;
  avgVal: number;
  formatFn: (v: number) => string;
  delta: number;
  higherIsBetter: boolean;
}

function ComparisonBar({ label, playerVal, avgVal, formatFn, delta, higherIsBetter }: ComparisonBarProps) {
  const isGood = higherIsBetter ? delta >= 0 : delta <= 0;
  const deltaColor = isGood ? "text-[var(--green)]" : "text-[var(--pink)]";
  const deltaPrefix = delta >= 0 ? "+" : "";

  return (
    <div className="card cyber-border p-4">
      <p className="font-alt text-sm tracking-widest uppercase text-[var(--text-dim)] mb-3">{label}</p>
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="font-body text-sm text-[var(--text-dim)]">You</p>
          <p className={cn("font-callout text-2xl", deltaColor)}>{formatFn(playerVal)}</p>
        </div>
        <p className={cn("font-callout text-base", deltaColor)}>
          {deltaPrefix}{typeof delta === "number" && Math.abs(delta) < 1
            ? (delta * 100).toFixed(1) + "pp"
            : formatFn(Math.abs(delta))}
        </p>
        <div className="text-right">
          <p className="font-body text-sm text-[var(--text-dim)]">Field avg</p>
          <p className="font-callout text-2xl text-[var(--text-dim)]">{formatFn(avgVal)}</p>
        </div>
      </div>
    </div>
  );
}

interface RelCardProps {
  title: string;
  subtitle: string;
  name: string;
  href: string;
  accent: "cyan" | "pink" | "green";
  icon: React.ReactNode;
}

function RelCard({ title, subtitle, name, href, accent, icon }: RelCardProps) {
  const accentClass = {
    cyan: "text-[var(--cyan)] border-[var(--cyan)]/20",
    pink: "text-[var(--pink)] border-[var(--pink)]/20",
    green: "text-[var(--green)] border-[var(--green)]/20",
  }[accent];

  return (
    <Link href={href} className={cn("card p-4 border hover:bg-white/[0.03] transition-all group", accentClass)}>
      <div className={cn("font-sub flex items-center gap-2 mb-3 text-xs tracking-widest uppercase", accentClass)}>
        {icon}
        <span>{title}</span>
      </div>
      <p className="font-body text-base text-[var(--text-bright)] group-hover:text-white transition-colors truncate">
        {name}
      </p>
      <p className="font-alt text-sm text-[var(--text-dim)] mt-1">{subtitle}</p>
    </Link>
  );
}
