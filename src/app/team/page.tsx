"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Shield, User, Users, CheckCircle2, AlertOctagon, 
  ShieldAlert, Clock, Flag, Trophy, Key 
} from "lucide-react";
import ClientAntiCheatWatcher from "@/components/ClientAntiCheatWatcher";
import SuspensionModal from "@/components/SuspensionModal";

export default function TeamProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [solves, setSolves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [disciplinaryStatus, setDisciplinaryStatus] = useState("ACTIVE");
  const [suspensionReason, setSuspensionReason] = useState("");

  const fetchData = async () => {
    try {
      const sessRes = await fetch("/api/auth/session");
      const sessData = await sessRes.json();
      if (!sessData.authenticated || sessData.role !== "PARTICIPANT") {
        router.push("/login");
        return;
      }
      setSession(sessData);
      setDisciplinaryStatus(sessData.team?.disciplinaryStatus || "ACTIVE");
      setSuspensionReason(sessData.team?.suspensionReason || "");

      // Fetch team details and solved challenges
      const chalRes = await fetch("/api/challenges");
      const chalData = await chalRes.json();
      const solvedList = (chalData.challenges || []).filter((c: any) => c.isSolved);
      setSolves(solvedList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center font-mono text-xs text-cyber-neon">
        LOADING TEAM DOSSIER...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 font-mono">
      <ClientAntiCheatWatcher
        teamId={session?.team?.id}
        memberId={session?.member?.id}
        disciplinaryStatus={disciplinaryStatus}
        onStatusChange={(s, r) => {
          setDisciplinaryStatus(s);
          setSuspensionReason(r || "");
        }}
      />

      <SuspensionModal
        status={disciplinaryStatus}
        reason={suspensionReason}
        teamId={session?.team?.id}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-cyber-border">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-cyber-neon">
            <Shield className="w-4 h-4" />
            <span>OPERATIVE ROSTER & SOLVE DOSSIER</span>
          </div>
          <h1 className="text-3xl font-black text-cyber-text tracking-wide uppercase">
            TEAM PROFILE: <span className="text-cyber-neon">{session?.team?.id}</span>
          </h1>
          <p className="text-xs text-cyber-muted mt-1">{session?.team?.name}</p>
        </div>

        <div className={`px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
          disciplinaryStatus === "ACTIVE"
            ? "border-cyber-neon bg-cyber-neon/10 text-cyber-neon"
            : disciplinaryStatus === "WARNING_SUSPENDED"
            ? "border-cyber-amber bg-cyber-amber/20 text-cyber-amber animate-pulse"
            : "border-cyber-red bg-cyber-red/20 text-cyber-red"
        }`}>
          {disciplinaryStatus === "DISQUALIFIED" && <AlertOctagon className="w-4 h-4" />}
          {disciplinaryStatus === "WARNING_SUSPENDED" && <ShieldAlert className="w-4 h-4" />}
          <span>{disciplinaryStatus}</span>
        </div>
      </div>

      {/* Team Disciplinary Overview Card */}
      <div className="p-6 rounded-2xl border border-cyber-border bg-cyber-card mb-8">
        <h2 className="text-sm font-bold text-cyber-text uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-cyber-border pb-3">
          <ShieldAlert className="w-4 h-4 text-cyber-amber" />
          <span>Disciplinary & Policy Telemetry</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-cyber-bg rounded-xl border border-cyber-border">
            <span className="text-cyber-muted uppercase text-[10px] block mb-1">Status Classification</span>
            <span className="font-bold text-cyber-text text-sm">{disciplinaryStatus}</span>
          </div>

          <div className="p-4 bg-cyber-bg rounded-xl border border-cyber-border">
            <span className="text-cyber-muted uppercase text-[10px] block mb-1">Warning Reinstatement</span>
            <span className="font-bold text-cyber-amber text-sm">
              {session?.team?.warningCount === 0 ? "1 AVAILABLE (PRISTINE)" : "1 OF 1 CONSUMED"}
            </span>
          </div>

          <div className="p-4 bg-cyber-bg rounded-xl border border-cyber-border">
            <span className="text-cyber-muted uppercase text-[10px] block mb-1">Total Points</span>
            <span className="font-black text-cyber-neon text-lg">{session?.team?.totalScore || 0} PTS</span>
          </div>
        </div>
      </div>

      {/* Operative Sessions & Member Allocation */}
      <div className="p-6 rounded-2xl border border-cyber-border bg-cyber-card mb-8">
        <h2 className="text-sm font-bold text-cyber-text uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-cyber-border pb-3">
          <Users className="w-4 h-4 text-cyber-blue" />
          <span>Registered Operative Slots (Max 2 Per Team)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className={`p-5 rounded-xl border ${session?.member?.slot === 1 ? 'border-cyber-neon bg-cyber-neon/[0.03]' : 'border-cyber-border bg-cyber-bg'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-cyber-neon text-sm">OPERATIVE SLOT 1</span>
              {session?.member?.slot === 1 && (
                <span className="text-[10px] font-bold bg-cyber-neon text-cyber-bg px-2 py-0.5 rounded">
                  CURRENT USER
                </span>
              )}
            </div>
            <p className="text-cyber-text font-bold mb-1">Operative Alpha</p>
            <span className="text-cyber-muted text-[11px] block">
              Access Code Prefix: <span className="text-cyber-text">ACC-***-A</span>
            </span>
            <span className="text-cyber-muted text-[11px] block mt-1">
              Policy Agreement: <span className="text-cyber-neon font-bold">ACKNOWLEDGED</span>
            </span>
          </div>

          <div className={`p-5 rounded-xl border ${session?.member?.slot === 2 ? 'border-cyber-neon bg-cyber-neon/[0.03]' : 'border-cyber-border bg-cyber-bg'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-cyber-blue text-sm">OPERATIVE SLOT 2</span>
              {session?.member?.slot === 2 && (
                <span className="text-[10px] font-bold bg-cyber-blue text-cyber-bg px-2 py-0.5 rounded">
                  CURRENT USER
                </span>
              )}
            </div>
            <p className="text-cyber-text font-bold mb-1">Operative Bravo</p>
            <span className="text-cyber-muted text-[11px] block">
              Access Code Prefix: <span className="text-cyber-text">ACC-***-B</span>
            </span>
            <span className="text-cyber-muted text-[11px] block mt-1">
              Policy Agreement: <span className="text-cyber-neon font-bold">ACKNOWLEDGED</span>
            </span>
          </div>
        </div>
      </div>

      {/* Solved Challenges Timeline */}
      <div className="p-6 rounded-2xl border border-cyber-border bg-cyber-card">
        <h2 className="text-sm font-bold text-cyber-text uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-cyber-border pb-3">
          <Trophy className="w-4 h-4 text-cyber-amber" />
          <span>Verified Flag Submissions ({solves.length})</span>
        </h2>

        {solves.length === 0 ? (
          <p className="text-xs text-cyber-muted py-4 text-center">
            No flags verified yet. Explore available missions in the challenge directory.
          </p>
        ) : (
          <div className="space-y-3">
            {solves.map((c: any) => (
              <div key={c.id} className="p-3.5 bg-cyber-bg rounded-xl border border-cyber-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-cyber-neon shrink-0" />
                  <div>
                    <span className="font-bold text-cyber-text">{c.id} - {c.title}</span>
                    <span className="text-[10px] text-cyber-muted block uppercase">
                      {c.category.replace("_", " ")} • {c.difficulty}
                    </span>
                  </div>
                </div>
                <span className="font-black text-cyber-neon">+{c.points} PTS</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
