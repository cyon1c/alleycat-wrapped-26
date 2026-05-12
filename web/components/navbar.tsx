"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "// GLOBAL" },
    { href: "/players", label: "// ASSETS" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo.png"
            alt="Alleycat"
            width={36}
            height={36}
            className="rounded-sm group-hover:opacity-90 transition-opacity"
          />
          <span className="font-headline text-sm tracking-widest text-[var(--cyan)] glow-cyan hidden sm:block">
            ALLEYCAT
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "font-alt px-4 py-2 text-xs tracking-wider transition-all duration-200",
                pathname === link.href
                  ? "text-[var(--cyan)] border border-[var(--cyan)]/40 bg-[var(--cyan)]/5"
                  : "text-[var(--text-dim)] hover:text-[var(--text)] border border-transparent"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
