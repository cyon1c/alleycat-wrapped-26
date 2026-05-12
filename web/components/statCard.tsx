import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "cyan" | "pink" | "green";
  className?: string;
}

export default function StatCard({ label, value, sub, accent = "cyan", className }: StatCardProps) {
  const accentClass = {
    cyan: "text-[var(--cyan)] glow-cyan",
    pink: "text-[var(--pink)] glow-pink",
    green: "text-[var(--green)] glow-green",
  }[accent];

  return (
    <div className={cn("card cyber-border p-5", className)}>
      <p className="font-alt text-[var(--text-dim)] text-sm tracking-widest uppercase mb-2">{label}</p>
      <p className={cn("font-callout text-3xl", accentClass)}>{value}</p>
      {sub && <p className="font-body text-[var(--text-dim)] text-sm mt-1">{sub}</p>}
    </div>
  );
}
