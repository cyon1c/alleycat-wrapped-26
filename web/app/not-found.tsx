import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <p className="font-callout text-6xl text-[var(--cyan)] glow-cyan mb-4">404</p>
      <p className="font-sub text-[var(--text-dim)] text-sm mb-2 tracking-wider">SIGNAL LOST</p>
      <p className="font-body text-[var(--text-dim)] text-xs mb-8">That asset or page doesn&apos;t exist in the net.</p>
      <Link
        href="/"
        className="font-sub px-6 py-2 border border-[var(--cyan)]/40 text-[var(--cyan)] text-xs tracking-widest hover:bg-[var(--cyan)]/10 transition-colors"
      >
        RETURN TO BASE
      </Link>
    </div>
  );
}
