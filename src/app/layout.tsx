import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "NATIONAL CTF CYBER ARENA | Championship Platform",
  description: "Advanced Team-Based Cybersecurity Competition Platform with Live Browser Labs & Server-Side Dynamic Flags",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-cyber-bg text-cyber-text antialiased selection:bg-cyber-neon selection:text-cyber-bg flex flex-col">
        <Navbar />
        <main className="flex-1 cyber-grid-pattern">
          {children}
        </main>
        <footer className="border-t border-cyber-border bg-cyber-card py-6 text-center text-xs font-mono text-cyber-muted">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyber-neon animate-pulse" />
              <span>NATIONAL CTF CYBER ARENA • PRODUCTION READY 2026</span>
            </div>
            <div>
              <span>ISOLATED LAB GATEWAY • ANTI-CHEAT TAMPER SURVEILLANCE • SERVER AUTHORITATIVE</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
