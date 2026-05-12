"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { PlayerSummary } from "@/lib/types";
import { cn, formatPct, formatTime } from "@/lib/utils";

interface PlayerSearchProps {
  players: PlayerSummary[];
}

function RoleColumn({
  title,
  accent,
  players,
}: {
  title: string;
  accent: "cyan" | "pink";
  players: PlayerSummary[];
}) {
  const accentClass = accent === "cyan" ? "text-[var(--cyan)]" : "text-[var(--pink)]";
  const borderClass = accent === "cyan" ? "border-[var(--cyan)]/30" : "border-[var(--pink)]/30";

  return (
    <div className="flex flex-col min-h-0">
      {/* Column header */}
      <div className={cn("flex items-center justify-between px-4 py-3 border-b", borderClass)}>
        <span className={cn("font-sub text-sm tracking-widest uppercase", accentClass)}>{title}</span>
        <span className="font-callout text-sm text-[var(--text-dim)]">{players.length}</span>
      </div>

      {/* Column header row */}
      <div className="grid grid-cols-[2rem_1fr_3.5rem_5rem] gap-2 px-4 py-2 border-b border-[var(--border)]">
        <span className="font-alt text-xs text-[var(--text-dim)]/60 tracking-widest">#</span>
        <span className="font-alt text-xs text-[var(--text-dim)]/60 tracking-widest uppercase">Name</span>
        <span className="font-alt text-xs text-[var(--text-dim)]/60 tracking-widest uppercase text-right">W/R</span>
        <span className="font-alt text-xs text-[var(--text-dim)]/60 tracking-widest uppercase text-right">Avg</span>
      </div>

      {/* Scrollable list */}
      <div className="overflow-y-auto flex-1">
        {players.length === 0 ? (
          <p className="font-body text-sm text-[var(--text-dim)] text-center py-8">No results</p>
        ) : (
          players.map((player, i) => (
            <Link
              key={player.id}
              href={`/players/${player.id}`}
              className="grid grid-cols-[2rem_1fr_3.5rem_5rem] gap-2 items-center px-4 py-2.5 border-b border-[var(--border)]/40 hover:bg-white/[0.025] last:border-0 transition-colors group"
            >
              <span className="font-callout text-sm text-[var(--text-dim)]/50">{i + 1}</span>
              <span className="font-body text-sm text-[var(--text)] group-hover:text-white transition-colors truncate">
                {player.name}
              </span>
              <span
                className={cn(
                  "font-callout text-sm text-right",
                  player.winRate >= 0.5 ? "text-[var(--green)]" : "text-[var(--pink)]"
                )}
              >
                {formatPct(player.winRate)}
              </span>
              <span className="font-callout text-sm text-right text-[var(--text-dim)]">
                {formatTime(player.avgTime)}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default function PlayerSearch({ players }: PlayerSearchProps) {
  const [query, setQuery] = useState("");

  const { hunters, bounties } = useMemo(() => {
    const q = query.toLowerCase().trim();
    const matched = q ? players.filter((p) => p.name.toLowerCase().includes(q)) : players;

    const hunters = matched
      .filter((p) => p.role === "hunter")
      .sort((a, b) => b.wins - a.wins);

    const bounties = matched
      .filter((p) => p.role === "bounty")
      .sort((a, b) => b.wins - a.wins);

    return { hunters, bounties };
  }, [players, query]);

  const total = hunters.length + bounties.length;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-dim)]" />
        <input
          type="text"
          placeholder="Search by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="font-body w-full bg-[var(--bg-card)] border border-[var(--border)] pl-9 pr-4 py-3 text-base text-[var(--text)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--cyan)]/60 focus:ring-1 focus:ring-[var(--cyan)]/20 rounded-sm transition-colors"
        />
      </div>

      {/* Count */}
      <p className="font-alt text-sm text-[var(--text-dim)] tracking-wider">
        {total} ASSET{total !== 1 ? "S" : ""}
      </p>

      {/* Two-column split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ height: "calc(100vh - 320px)", minHeight: "480px" }}>
        <div className="card cyber-border flex flex-col overflow-hidden">
          <RoleColumn title="Hunters" accent="cyan" players={hunters} />
        </div>
        <div className="card cyber-border flex flex-col overflow-hidden">
          <RoleColumn title="Bounties" accent="pink" players={bounties} />
        </div>
      </div>
    </div>
  );
}
