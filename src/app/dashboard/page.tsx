"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Trophy, Flag, Terminal, Shield, Clock, AlertTriangle, 
  ArrowRight, CheckCircle2, Zap, Lock, Cpu, Eye, Users 
} from "lucide-react";
import ClientAntiCheatWatcher from "@/components/ClientAntiCheatWatcher";
import SuspensionModal from "@/components/SuspensionModal";
import PolicyAcknowledgementModal from "@/components/PolicyAcknowledgementModal";

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [activeLab, setActiveLab] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Policy Modal
  const [showPolicy, setShowPolicy] = useState(false);

  // Team Disciplinary State
  const [disciplinaryStatus, setDisciplinaryStatus] = useState<string>("ACTIVE");
  const [suspensionReason, setSuspensionReason] = useState<string>("");

  const fetchData = async () => {
    try {
      const sessRes = await fetch("/api/auth/session");
      const sessData = await sessRes.json();

      if (!sessData.authenticated) {
        router.push("/login");
        return;
      }

      setSession(sessData);
      setDisciplinaryStatus(sessData.team?.disciplinaryStatus || "ACTIVE");
      setSuspensionReason(sessData.team?.suspensionReason || "");

      if (!sessData.member?.policyAccepted) {
        setShowPolicy(true);
      }

      // Fetch challenges
      const chRes = await fetch("/api/challenges");
      const chData = await chRes.json();
      setChallenges(chData.challenges || []);

      // Fetch active lab
      const labRes = await fetch("/api/labs/status");
      const labData = await labRes.json();
      setActiveLab(labData.activeLab || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // SSE Event Listener for real-time solves and disciplinary changes
    const es = new EventSource("/api/events");
    es.onmessage = (event) => {
      try {
        const p = JSON.parse(event.data);
        if (p.type === "TEAM_STATUS_CHANGED" && p.payload.teamId === session?.team?.id) {
          setDisciplinaryStatus(p.payload.status);
          setSuspensionReason(p.payload.reason || "");
        } else if (p.type === "LEADERBOARD_UPDATE" || p.type === "FLAG_SUBMISSION") {
          fetchData();
        }
      } catch (e) {}
    };

    return () => es.close();
  }, [session?.team?.id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center font-mono text-xs text-cyber-neon">
        <span className="w-2.5 h-2.5 rounded-full bg-cyber-neon animate-ping mr-3" />
        LOADING SECURE ARENA TELEMETRY...
      </div>
    );
  }

  // Calculate statistics
  const totalPoints = session?.team?.totalScore || 0;
  const solvesCount = challenges.filter(c => c.isSolved).length;
  const availableCount = challenges.filter(c => c.team_status === "AVAILABLE" && !c.isSolved).length;
  const lockedCount = challenges.filter(c => c.team_status === "LOCKED").length;

  // Category counts
  const categories = [
    { key: "NETWORK_PENETRATION", name: "Network Recon & Pivoting", color: "text-cyber-blue" },
    { key: "EXPLOITATION", name: "Exploitation & Web Targets", color: "text-cyber-red" },
    { key: "CRYPTOGRAPHY", name: "Cryptographic Puzzles", color: "text-cyber-neon" },
    { key: "DIGITAL_FORENSICS", name: "Digital Forensics & Memory", color: "text-cyber-amber" }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Background Tab Surveillance Engine */}
      <ClientAntiCheatWatcher
        teamId={session?.team?.id}
        memberId={session?.member?.id}
        disciplinaryStatus={disciplinaryStatus}
        onStatusChange={(newStatus, reason) => {
          setDisciplinaryStatus(newStatus);
          setSuspensionReason(reason || "");
        }}
      />

      {/* Mandatory First-Violation Suspension Modal or Disqualification Modal */}
      <SuspensionModal
        status={disciplinaryStatus}
        reason={suspensionReason}
        teamId={session?.team?.id}
      />

      {/* Mandatory Policy Acknowledgement Modal */}
      <PolicyAcknowledgementModal
        isOpen={showPolicy}
        onAccepted={() => {
          setShowPolicy(false);
          fetchData();
        }}
      />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-cyber-border font-mono">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-cyber-muted uppercase">OPERATIONAL DESK:</span>
            <span className="px-2 py-0.5 rounded bg-cyber-card border border-cyber-border text-cyber-neon text-xs font-bold">
              {session?.team?.id}
            </span>
            <span className="text-xs text-cyber-muted">•</span>
            <span className="text-xs text-cyber-text font-bold">{session?.team?.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-cyber-text tracking-wide uppercase">
            OPERATIVE <span className="text-cyber-neon">COMMAND DASHBOARD</span>
          </h1>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyber-card border border-cyber-border rounded-xl flex items-center gap-3 text-xs">
            <Users className="w-4 h-4 text-cyber-blue" />
            <div>
              <span className="text-[10px] text-cyber-muted block">ACTIVE OPERATIVE</span>
              <span className="font-bold text-cyber-text">{session?.member?.name}</span>
            </div>
          </div>

          <div className={`p-3 border rounded-xl flex items-center gap-2 text-xs font-bold uppercase ${
            disciplinaryStatus === "ACTIVE"
              ? "bg-cyber-neon/10 border-cyber-neon/30 text-cyber-neon"
              : disciplinaryStatus === "WARNING_SUSPENDED"
              ? "bg-cyber-amber/20 border-cyber-amber text-cyber-amber animate-pulse"
              : "bg-cyber-red/20 border-cyber-red text-cyber-red"
          }`}>
            <Shield className="w-4 h-4" />
            <span>{disciplinaryStatus}</span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 font-mono">
        <div className="p-5 rounded-xl border border-cyber-border bg-cyber-card text-center">
          <span className="text-xs text-cyber-muted uppercase block mb-1">Total Score</span>
          <span className="text-3xl sm:text-4xl font-black text-cyber-neon tracking-tight text-shadow-neon">
            {totalPoints}
          </span>
          <span className="text-[10px] text-cyber-muted block mt-1">POINTS EARNED</span>
        </div>

        <div className="p-5 rounded-xl border border-cyber-border bg-cyber-card text-center">
          <span className="text-xs text-cyber-muted uppercase block mb-1">Completed</span>
          <span className="text-3xl sm:text-4xl font-black text-cyber-blue tracking-tight">
            {solvesCount}
          </span>
          <span className="text-[10px] text-cyber-muted block mt-1">/ {challenges.length} SOLVED</span>
        </div>

        <div className="p-5 rounded-xl border border-cyber-border bg-cyber-card text-center">
          <span className="text-xs text-cyber-muted uppercase block mb-1">Available Targets</span>
          <span className="text-3xl sm:text-4xl font-black text-cyber-amber tracking-tight">
            {availableCount}
          </span>
          <span className="text-[10px] text-cyber-muted block mt-1">READY TO PROBE</span>
        </div>

        <div className="p-5 rounded-xl border border-cyber-border bg-cyber-card text-center">
          <span className="text-xs text-cyber-muted uppercase block mb-1">Locked Prereqs</span>
          <span className="text-3xl sm:text-4xl font-black text-cyber-muted tracking-tight">
            {lockedCount}
          </span>
          <span className="text-[10px] text-cyber-muted block mt-1">SOLVE PREREQUISITES</span>
        </div>
      </div>

      {/* Active Lab Widget (If Running) */}
      {activeLab && (
        <div className="mb-8 p-6 rounded-2xl border border-cyber-blue bg-cyber-blue/5 shadow-blue flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-cyber-blue/10 border border-cyber-blue text-cyber-blue shrink-0">
              <Terminal className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/40">
                  ACTIVE LAB INSTANCE
                </span>
                <span className="text-xs text-cyber-text font-bold">{activeLab.challengeId}</span>
              </div>
              <span className="text-sm font-bold text-cyber-text">
                Target IP: <span className="text-cyber-neon">{activeLab.targetIp}:{activeLab.targetPort}</span>
              </span>
              <p className="text-xs text-cyber-muted mt-0.5">
                Isolated sandbox container running. Dedicated per-team IP routing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link
              href={`/challenges/${activeLab.challengeId}`}
              className="flex-1 md:flex-initial px-5 py-2.5 rounded-lg bg-cyber-blue text-cyber-bg font-bold text-xs uppercase tracking-wider hover:bg-cyber-blue/90 transition-all text-center flex items-center justify-center gap-2"
            >
              <span>RESUME LAB TERMINAL</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Grid: Category Solves & Quick Challenges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Breakdown (Col 1) */}
        <div className="p-6 rounded-xl border border-cyber-border bg-cyber-card font-mono space-y-4">
          <h2 className="text-sm font-bold text-cyber-text uppercase tracking-wider flex items-center gap-2 border-b border-cyber-border pb-3">
            <Cpu className="w-4 h-4 text-cyber-neon" />
            <span>Category Performance</span>
          </h2>

          <div className="space-y-4 pt-2">
            {categories.map(cat => {
              const catTotal = challenges.filter(c => c.category === cat.key).length;
              const catSolves = challenges.filter(c => c.category === cat.key && c.isSolved).length;
              const pct = catTotal > 0 ? Math.round((catSolves / catTotal) * 100) : 0;

              return (
                <div key={cat.key} className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-cyber-muted">
                    <span className={cat.color}>{cat.name}</span>
                    <span>{catSolves} / {catTotal} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-cyber-bg rounded-full overflow-hidden border border-cyber-border">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cat.key === "NETWORK_PENETRATION" ? "bg-cyber-blue" :
                        cat.key === "EXPLOITATION" ? "bg-cyber-red" :
                        cat.key === "CRYPTOGRAPHY" ? "bg-cyber-neon" : "bg-cyber-amber"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-cyber-border text-[11px] text-cyber-muted space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-cyber-neon" />
              <span>Client tab monitoring active.</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-cyber-blue" />
              <span>Shared team disciplinary status: {disciplinaryStatus}</span>
            </div>
          </div>
        </div>

        {/* Priority Challenge Recommendations (Col 2 & 3) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between font-mono">
            <h2 className="text-sm font-bold text-cyber-text uppercase tracking-wider flex items-center gap-2">
              <Flag className="w-4 h-4 text-cyber-amber" />
              <span>Available Missions ({availableCount})</span>
            </h2>
            <Link
              href="/challenges"
              className="text-xs text-cyber-neon hover:underline flex items-center gap-1"
            >
              <span>View All Challenges</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {challenges.filter(c => !c.isSolved && c.team_status === "AVAILABLE").slice(0, 6).map(chal => (
              <div
                key={chal.id}
                className="p-5 rounded-xl border border-cyber-border bg-cyber-card hover:border-cyber-neon/60 transition-all font-mono flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-2">
                    <span className="px-2 py-0.5 rounded bg-cyber-bg border border-cyber-border text-cyber-neon font-bold">
                      {chal.id}
                    </span>
                    <span className="text-cyber-amber font-bold">
                      {chal.points} PTS
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-cyber-text mb-1 truncate">
                    {chal.title}
                  </h3>
                  <span className="text-[10px] text-cyber-muted uppercase block mb-3">
                    {chal.difficulty} • {chal.category.replace("_", " ")}
                  </span>
                  <p className="text-xs text-cyber-muted line-clamp-2 leading-relaxed mb-4">
                    {chal.description}
                  </p>
                </div>

                <Link
                  href={`/challenges/${chal.id}`}
                  className="w-full py-2 rounded-lg bg-cyber-bg border border-cyber-border hover:border-cyber-neon text-cyber-text hover:text-cyber-neon text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>ENGAGE TARGET</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
