"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, User, Key, AlertCircle, ArrowRight, Check } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"PARTICIPANT" | "ADMIN">("PARTICIPANT");

  // Participant Form
  const [teamId, setTeamId] = useState("");
  const [password, setPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");

  // Admin Form
  const [username, setUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParticipantLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginType: "PARTICIPANT",
          teamId,
          password,
          accessCode
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed.");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginType: "ADMIN",
          username,
          password: adminPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Admin login failed.");
      }

      router.push("/admin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick helper buttons for testing
  const fillSample = (tId: string, pass: string, code: string) => {
    setTeamId(tId);
    setPassword(pass);
    setAccessCode(code);
    setError(null);
  };

  const fillAdmin = () => {
    setUsername("admin");
    setAdminPassword("Admin2026!NationalArena");
    setError(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full border border-cyber-border bg-cyber-card/95 rounded-2xl p-6 sm:p-8 backdrop-blur shadow-2xl relative">
        {/* Glow Top Accent */}
        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${tab === "PARTICIPANT" ? "bg-cyber-neon shadow-neon" : "bg-cyber-blue shadow-blue"}`} />

        <div className="flex justify-center mb-6">
          <div className="p-3 rounded-xl bg-cyber-surface border border-cyber-border text-cyber-neon shadow-sm">
            <Shield className="w-8 h-8" />
          </div>
        </div>

        <h1 className="text-2xl font-black font-mono text-center text-cyber-text tracking-wider uppercase mb-1">
          ARENA ACCESS GATEWAY
        </h1>
        <p className="text-xs font-mono text-center text-cyber-muted mb-6">
          National CTF Cyber Arena • Secure Authentication
        </p>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-cyber-bg border border-cyber-border rounded-xl mb-6 font-mono text-xs">
          <button
            onClick={() => { setTab("PARTICIPANT"); setError(null); }}
            className={`py-2 rounded-lg font-bold transition-all ${
              tab === "PARTICIPANT"
                ? "bg-cyber-card text-cyber-neon border border-cyber-neon/40 shadow-sm"
                : "text-cyber-muted hover:text-cyber-text"
            }`}
          >
            PARTICIPANT LOGIN
          </button>
          <button
            onClick={() => { setTab("ADMIN"); setError(null); }}
            className={`py-2 rounded-lg font-bold transition-all ${
              tab === "ADMIN"
                ? "bg-cyber-card text-cyber-blue border border-cyber-blue/40 shadow-sm"
                : "text-cyber-muted hover:text-cyber-text"
            }`}
          >
            ADMINISTRATOR
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-cyber-red/10 border border-cyber-red/40 text-cyber-red text-xs font-mono mb-6 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* PARTICIPANT TAB */}
        {tab === "PARTICIPANT" ? (
          <form onSubmit={handleParticipantLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-cyber-muted mb-1.5 uppercase">
                Assigned Team ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value.toUpperCase())}
                  placeholder="CTF-TEAM-001"
                  className="w-full bg-cyber-bg border border-cyber-border focus:border-cyber-neon rounded-lg px-3.5 py-2.5 text-xs font-mono text-cyber-text outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-cyber-muted mb-1.5 uppercase">
                Team Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-cyber-bg border border-cyber-border focus:border-cyber-neon rounded-lg px-3.5 py-2.5 text-xs font-mono text-cyber-text outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-cyber-muted mb-1.5 uppercase">
                Member Access Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="ACC-001-A or ACC-001-B"
                  className="w-full bg-cyber-bg border border-cyber-border focus:border-cyber-neon rounded-lg px-3.5 py-2.5 text-xs font-mono text-cyber-text outline-none transition-colors"
                />
              </div>
              <p className="text-[10px] text-cyber-muted font-mono mt-1">
                Both registered members share the team password with distinct access codes.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-cyber-neon text-cyber-bg font-mono font-bold text-xs uppercase tracking-wider hover:bg-cyber-neon/90 hover:shadow-neon transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
            >
              <span>{loading ? "Authenticating Operative..." : "Authenticate Team Session"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Demo Fill Buttons */}
            <div className="pt-4 border-t border-cyber-border/80">
              <span className="text-[10px] font-mono text-cyber-muted block mb-2">QUICK TEST PRESETS:</span>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => fillSample("CTF-TEAM-001", "Arena2026#ctf-team-001", "ACC-001-A")}
                  className="px-2 py-1.5 rounded bg-cyber-bg border border-cyber-border hover:border-cyber-neon text-cyber-muted hover:text-cyber-neon text-left transition-colors truncate"
                >
                  ⚡ Team 1 Member 1
                </button>
                <button
                  type="button"
                  onClick={() => fillSample("CTF-TEAM-001", "Arena2026#ctf-team-001", "ACC-001-B")}
                  className="px-2 py-1.5 rounded bg-cyber-bg border border-cyber-border hover:border-cyber-neon text-cyber-muted hover:text-cyber-neon text-left transition-colors truncate"
                >
                  ⚡ Team 1 Member 2
                </button>
                <button
                  type="button"
                  onClick={() => fillSample("CTF-TEAM-002", "Arena2026#ctf-team-002", "ACC-002-A")}
                  className="px-2 py-1.5 rounded bg-cyber-bg border border-cyber-border hover:border-cyber-neon text-cyber-muted hover:text-cyber-neon text-left transition-colors truncate"
                >
                  ⚡ Team 2 Member 1
                </button>
                <button
                  type="button"
                  onClick={() => fillSample("CTF-TEAM-003", "Arena2026#ctf-team-003", "ACC-003-A")}
                  className="px-2 py-1.5 rounded bg-cyber-bg border border-cyber-border hover:border-cyber-neon text-cyber-muted hover:text-cyber-neon text-left transition-colors truncate"
                >
                  ⚡ Team 3 Member 1
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* ADMIN TAB */
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-cyber-muted mb-1.5 uppercase">
                Admin Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-cyber-bg border border-cyber-border focus:border-cyber-blue rounded-lg px-3.5 py-2.5 text-xs font-mono text-cyber-text outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-cyber-muted mb-1.5 uppercase">
                Master Password
              </label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-cyber-bg border border-cyber-border focus:border-cyber-blue rounded-lg px-3.5 py-2.5 text-xs font-mono text-cyber-text outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-cyber-blue text-cyber-bg font-mono font-bold text-xs uppercase tracking-wider hover:bg-cyber-blue/90 hover:shadow-blue transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
            >
              <span>{loading ? "Authenticating..." : "Access Control Center"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Demo Fill Button */}
            <div className="pt-4 border-t border-cyber-border/80">
              <span className="text-[10px] font-mono text-cyber-muted block mb-2">QUICK TEST PRESET:</span>
              <button
                type="button"
                onClick={fillAdmin}
                className="w-full px-3 py-2 rounded bg-cyber-bg border border-cyber-border hover:border-cyber-blue text-cyber-muted hover:text-cyber-blue text-xs font-mono transition-colors text-left"
              >
                ⚡ Fill Super Administrator Credentials
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
