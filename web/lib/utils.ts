import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Times in the dataset are stored in milliseconds. */
export function formatTime(ms: number | null | undefined): string {
  if (ms == null) return "—";
  if (ms === 0) return "0 ms";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

/** Format a millisecond total as a compact duration string (e.g. "56m" or "2h 14m"). */
export function formatDuration(ms: number): string {
  const totalSeconds = ms / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes} min`;
  return `${hours}h ${minutes} min`;
}

export function formatPct(rate: number | null | undefined): string {
  if (rate == null) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString();
}

export function roleLabel(role: string): string {
  return role === "hunter" ? "Hunter" : "Bounty";
}

export function roleColor(role: string): string {
  return role === "hunter" ? "text-cyan-400" : "text-pink-400";
}

export function roleBg(role: string): string {
  return role === "hunter" ? "bg-cyan-400/10 border-cyan-400/30" : "bg-pink-400/10 border-pink-400/30";
}
