"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Shield, Terminal, Trophy, Flag, BookOpen, User, 
  Settings, LogOut, AlertOctagon, ShieldAlert, Cpu
} from "lucide-react";
import CompetitionTimer from "./CompetitionTimer";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = () => {
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(d => {
        if (d.authenticated) setSession(d);
        else setSession(null);
      })
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSession();

    // Listen to team status change events
    const es = new EventSource("/api/events");
    es.onmessage = (event) => {
      try {
        const p = JSON.parse(event.data);
        if (p.type === "TEAM_STATUS_CHANGED") {
          fetchSession();
        }
      } catch (e) {}
    };

    return () => es.close();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
    router.push("/login");
  };

  const navLinks = [
    { label: "Dashboard", href: "/dashboard", icon: Cpu, authOnly: true },
    { label: "Challenges", href: "/challenges", icon: Flag },
    { label: "Live Labs", href: "/labs", icon: Terminal, authOnly: true },
    { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { label: "Rules", href: "/rules", icon: BookOpen },
    { label: "Team Profile", href: "/team", icon: User, participantOnly: true },
    { label: "Admin Portal", href: "/admin", icon: Settings, adminOnly: true }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cyber-border bg-cyber-bg/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="p-2 rounded-lg bg-cyber-card border border-cyber-border group-hover:border-cyber-neon transition-colors shadow-sm">
            <Shield className="w-5 h-5 text-cyber-neon animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono font-black text-sm tracking-wider text-cyber-text group-hover:text-cyber-neon transition-colors flex items-center gap-1.5">
              NATIONAL CTF <span className="text-cyber-neon">CYBER ARENA</span>
            </span>
            <span className="text-[10px] text-cyber-muted font-mono tracking-widest uppercase">
              Championship Final 2026
            </span>
          </div>
        </Link>

        {/* Global Timer */}
        <div className="hidden md:flex items-center">
          <CompetitionTimer />
        </div>

        {/* Navigation Items */}
        <nav className="hidden lg:flex items-center gap-1 font-mono text-xs">
          {navLinks.map((link) => {
            if (link.adminOnly && session?.role !== "ADMIN") return null;
            if (link.participantOnly && session?.role !== "PARTICIPANT") return null;
            if (link.authOnly && !session?.authenticated) return null;

            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                  isActive
                    ? "bg-cyber-card text-cyber-neon border border-cyber-neon/40 shadow-neon"
                    : "text-cyber-muted hover:text-cyber-text hover:bg-cyber-card/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User / Team Disciplinary Info */}
        <div className="flex items-center gap-3">
          {session?.authenticated ? (
            <div className="flex items-center gap-2.5">
              {session.role === "PARTICIPANT" ? (
                <div className="flex items-center gap-2 font-mono text-xs">
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="font-bold text-cyber-text">{session.team?.id}</span>
                    <span className="text-[10px] text-cyber-muted">{session.member?.name}</span>
                  </div>

                  {/* Disciplinary Badge */}
                  <span
                    className={`px-2.5 py-1 rounded border text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                      session.team?.disciplinaryStatus === "ACTIVE"
                        ? "border-cyber-neon/50 bg-cyber-neon/10 text-cyber-neon"
                        : session.team?.disciplinaryStatus === "WARNING_SUSPENDED"
                        ? "border-cyber-amber bg-cyber-amber/20 text-cyber-amber animate-pulse"
                        : session.team?.disciplinaryStatus === "DISQUALIFIED"
                        ? "border-cyber-red bg-cyber-red/20 text-cyber-red animate-pulse"
                        : "border-cyber-amber/50 bg-cyber-amber/10 text-cyber-amber"
                    }`}
                  >
                    {session.team?.disciplinaryStatus === "DISQUALIFIED" && <AlertOctagon className="w-3.5 h-3.5" />}
                    {session.team?.disciplinaryStatus === "WARNING_SUSPENDED" && <ShieldAlert className="w-3.5 h-3.5" />}
                    {session.team?.disciplinaryStatus}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2.5 py-1 rounded border border-cyber-blue/50 bg-cyber-blue/10 text-cyber-blue font-bold tracking-wider">
                    SUPER ADMIN
                  </span>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="p-2 rounded-lg border border-cyber-border hover:border-cyber-red text-cyber-muted hover:text-cyber-red transition-colors"
                title="Logout session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg bg-cyber-neon/10 border border-cyber-neon/40 text-cyber-neon hover:bg-cyber-neon hover:text-cyber-bg font-mono text-xs font-bold transition-all shadow-sm hover:shadow-neon"
            >
              COMPETITION LOGIN
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
