import Link from "next/link";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  playerId: string;
  name: string;
  value: string;
  valueLabel?: string;
}

interface LeaderboardCardProps {
  title: string;
  entries: LeaderboardEntry[];
  accent?: "cyan" | "pink" | "green";
  className?: string;
}

export default function LeaderboardCard({ title, entries, accent = "cyan", className }: LeaderboardCardProps) {
  const accentText = {
    cyan: "text-[var(--cyan)]",
    pink: "text-[var(--pink)]",
    green: "text-[var(--green)]",
  }[accent];

  const podiumColors = [accentText, "text-[var(--text-dim)]", "text-[var(--text-dim)]"];

  return (
    <div className={cn("card cyber-border", className)}>
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <h3 className={cn("font-sub text-sm tracking-widest uppercase", accentText)}>{title}</h3>
      </div>
      <div className="divide-y divide-[var(--border)]/50">
        {entries.map((entry, i) => (
          <Link
            key={entry.playerId}
            href={`/players/${entry.playerId}`}
            className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.03] group transition-colors"
          >
            <span className={cn(
              "font-callout text-sm w-7 shrink-0",
              i < 3 ? podiumColors[i] : "text-[var(--text-dim)]/50"
            )}>
              #{entry.rank}
            </span>
            <span className="font-body flex-1 text-base text-[var(--text)] group-hover:text-white transition-colors truncate">
              {entry.name}
            </span>
            <span className="font-callout text-base shrink-0 text-[var(--text-dim)]">
              {entry.value}
              {entry.valueLabel && (
                <span className="font-alt ml-1 text-[var(--text-dim)]/50 text-sm">{entry.valueLabel}</span>
              )}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
