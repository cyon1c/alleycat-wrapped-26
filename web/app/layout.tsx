import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: "Alleycat // WRAPPED '26",
  description: "Your 4-day cyberpunk festival stats, decoded.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <footer className="border-t border-[var(--border)] mt-16 py-8 text-center text-[var(--text-dim)] text-sm font-alt">
          <span className="font-headline text-[var(--cyan)]">ALLEYCAT</span> // WRAPPED &apos;26 &nbsp;·&nbsp; 4 DAYS IN THE NET
        </footer>
      </body>
    </html>
  );
}
