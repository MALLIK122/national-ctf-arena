"use client";

import React, { useEffect, useState } from "react";
import { Terminal as TerminalIcon, Play, Square, ExternalLink, ShieldAlert, Cpu, Info } from "lucide-react";
import Terminal from "@/components/Terminal";
import ClientAntiCheatWatcher from "@/components/ClientAntiCheatWatcher";
import SuspensionModal from "@/components/SuspensionModal";

export default function LabsPage() {
  const [session, setSession] = useState<any>(null);
  const [activeLab, setActiveLab] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>("NET-01");
  const [loading, setLoading] = useState(true);
  const [labStarting, setLabStarting] = useState(false);

  // Disciplinary state
  const [disciplinaryStatus, setDisciplinaryStatus] = useState("ACTIVE");
  const [suspensionReason, setSuspensionReason] = useState("");

  const fetchData = async () => {
    try {
      const sessRes = await fetch("/api/auth/session");
      const sessData = await sessRes.json();
      if (!sessData.authenticated) {
        window.location.href = "/login";
        return;
      }
      setSession(sessData);
      setDisciplinaryStatus(sessData.team?.disciplinaryStatus || "ACTIVE");
      setSuspensionReason(sessData.team?.suspensionReason || "");

      const labRes = await fetch("/api/labs/status");
      const labData = await labRes.json();
      if (labData.activeLab) {
        setActiveLab(labData.activeLab);
        setSelectedChallengeId(labData.activeLab.challengeId);
      }

      const chalRes = await fetch("/api/challenges");
      const chalData = await chalRes.json();
      const labChals = (chalData.challenges || []).filter((c: any) => c.hasLiveLab);
      setChallenges(labChals);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLaunchLab = async () => {
    setLabStarting(true);
    try {
      const res = await fetch("/api/labs/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: selectedChallengeId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActiveLab(data.lab);
    } catch (err: any) {
      alert(`Launch error: ${err.message}`);
    } finally {
      setLabStarting(false);
    }
  };

  const handleStopLab = async () => {
    if (!activeLab) return;
    try {
      await fetch("/api/labs/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: activeLab.challengeId })
      });
      setActiveLab(null);
    } catch (e) {}
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 font-mono">
      {/* Tab Monitoring */}
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
          <div className="flex items-center gap-2 mb-1 text-xs text-cyber-blue">
            <TerminalIcon className="w-4 h-4" />
            <span>TRYHACKME & HTB INSPIRED LIVE ARCHITECTURE</span>
          </div>
          <h1 className="text-3xl font-black text-cyber-text tracking-wide uppercase">
            LIVE LAB <span className="text-cyber-blue">ENVIRONMENT GATEWAY</span>
          </h1>
        </div>

        <div className="px-3.5 py-1.5 rounded-lg border border-cyber-border bg-cyber-card text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyber-neon animate-pulse" />
          <span className="text-cyber-muted">ROUTING SUBNET:</span>
          <span className="text-cyber-neon font-bold">10.10.0.0/16</span>
        </div>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-3 p-6 rounded-2xl border border-cyber-border bg-cyber-card">
          <label className="block text-xs uppercase text-cyber-muted mb-2 font-bold">
            Select Lab Target:
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <select
              value={selectedChallengeId}
              onChange={(e) => setSelectedChallengeId(e.target.value)}
              disabled={Boolean(activeLab)}
              className="w-full sm:flex-1 bg-cyber-bg border border-cyber-border focus:border-cyber-blue rounded-lg px-4 py-2.5 text-xs text-cyber-text outline-none"
            >
              {challenges.map(c => (
                <option key={c.id} value={c.id}>
                  [{c.id}] {c.title} ({c.difficulty}) - {c.lab_type || 'LINUX_TERMINAL'}
                </option>
              ))}
            </select>

            {activeLab ? (
              <button
                onClick={handleStopLab}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-cyber-red bg-cyber-red/10 text-cyber-red hover:bg-cyber-red hover:text-cyber-bg transition-colors text-xs font-bold flex items-center justify-center gap-2"
              >
                <Square className="w-4 h-4" />
                <span>TERMINATE TARGET</span>
              </button>
            ) : (
              <button
                onClick={handleLaunchLab}
                disabled={labStarting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-cyber-blue text-cyber-bg hover:bg-cyber-blue/90 hover:shadow-blue transition-all text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                <span>{labStarting ? "SPAWNING POD..." : "DEPLOY LAB MACHINE"}</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-cyber-border bg-cyber-card text-xs space-y-2 flex flex-col justify-center">
          <div className="flex justify-between text-cyber-muted">
            <span>ISOLATION:</span>
            <span className="text-cyber-neon font-bold">CONTAINER CGROUP</span>
          </div>
          <div className="flex justify-between text-cyber-muted">
            <span>ALLOCATED CPU:</span>
            <span className="text-cyber-text font-bold">0.5 VCPU</span>
          </div>
          <div className="flex justify-between text-cyber-muted">
            <span>MEMORY LIMIT:</span>
            <span className="text-cyber-text font-bold">256 MB RAM</span>
          </div>
        </div>
      </div>

      {/* Terminal View */}
      {activeLab ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs bg-cyber-card px-4 py-2 rounded-xl border border-cyber-border">
            <span className="text-cyber-muted">
              TARGET URL: <span className="text-cyber-neon">{activeLab.internalUrl}</span>
            </span>
            <span className="text-cyber-muted">
              REMAINING: <span className="text-cyber-blue font-bold">{Math.floor(activeLab.remainingSeconds / 60)} MINS</span>
            </span>
          </div>

          <Terminal
            challengeId={activeLab.challengeId}
            targetIp={activeLab.targetIp}
            targetPort={activeLab.targetPort}
          />
        </div>
      ) : (
        <div className="border border-cyber-border bg-cyber-card/60 rounded-2xl p-16 text-center text-cyber-muted space-y-3">
          <TerminalIcon className="w-12 h-12 text-cyber-muted mx-auto opacity-40" />
          <h3 className="text-sm font-bold text-cyber-text">NO TARGET CONTAINER DEPLOYED</h3>
          <p className="text-xs max-w-md mx-auto">
            Choose an authorized challenge target from the selector above and click "DEPLOY LAB MACHINE" to spin up an isolated attack container.
          </p>
        </div>
      )}
    </div>
  );
}
