"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, Terminal, Flag, ShieldAlert, Clock, AlertTriangle, 
  CheckCircle2, Play, Pause, Download, Volume2, ArrowRight 
} from "lucide-react";
import { playCyberAlertSound } from "@/components/AudioAlert";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<any>({
    totalTeams: 50,
    onlineTeams: 0,
    onlineMembers: 0,
    activeLabs: 0,
    totalSolves: 0,
    totalSubmissions: 0,
    alertCount: 0
  });

  const [alerts, setAlerts] = useState<any[]>([]);
  const [timerSettings, setTimerSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverviewData = async () => {
    try {
      const teamRes = await fetch("/api/admin/teams");
      const teamData = await teamRes.json();
      const teams = teamData.teams || [];

      let onlineT = 0;
      let onlineM = 0;
      let violations = 0;

      for (const t of teams) {
        if (t.isOnline) onlineT++;
        if (t.members) {
          for (const m of t.members) {
            if (m.is_online) onlineM++;
          }
        }
        violations += (t.violation_count || 0);
      }

      const timerRes = await fetch("/api/admin/timer");
      const timerData = await timerRes.json();
      setTimerSettings(timerData);

      const lbRes = await fetch("/api/leaderboard");
      const lbData = await lbRes.json();

      setStats({
        totalTeams: teams.length || 50,
        onlineTeams: onlineT,
        onlineMembers: onlineM,
        activeLabs: 0, // will populate from lab monitoring
        totalSolves: lbData.statistics?.totalSolves || 0,
        totalSubmissions: lbData.statistics?.totalSubmissions || 0,
        alertCount: violations
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();

    // Listen to real-time events via SSE
    const es = new EventSource("/api/events");
    es.onmessage = (event) => {
      try {
        const p = JSON.parse(event.data);
        if (p.type === "SECURITY_ALERT") {
          playCyberAlertSound();
          setAlerts(prev => [p.payload, ...prev.slice(0, 20)]);
          setStats((prev: any) => ({ ...prev, alertCount: prev.alertCount + 1 }));
        } else if (p.type === "FLAG_SUBMISSION") {
          fetchOverviewData();
        } else if (p.type === "TIMER_UPDATE") {
          setTimerSettings(p.payload);
        }
      } catch (e) {}
    };

    return () => es.close();
  }, []);

  return (
    <div className="space-y-8 font-mono">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cyber-border">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-cyber-neon">
            <span className="w-2 h-2 rounded-full bg-cyber-neon animate-pulse" />
            <span>DIRECTORATE CENTRAL PROVING GROUND</span>
          </div>
          <h1 className="text-3xl font-black text-cyber-text tracking-wide uppercase">
            LIVE ARENA <span className="text-cyber-neon">OVERVIEW</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/api/auth/export-credentials"
            className="px-4 py-2 rounded-lg border border-cyber-border bg-cyber-card hover:border-cyber-neon text-cyber-text hover:text-cyber-neon transition-colors text-xs font-bold flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT 50 TEAM CREDENTIALS (CSV)</span>
          </a>

          <Link
            href="/admin/disciplinary"
            className="px-4 py-2 rounded-lg bg-cyber-amber text-cyber-bg hover:bg-cyber-amber/90 transition-all text-xs font-bold flex items-center gap-2 shadow-sm"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>DISCIPLINARY MONITORING</span>
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-cyber-border bg-cyber-card">
          <span className="text-[10px] text-cyber-muted uppercase block mb-1">Provisioned Teams</span>
          <span className="text-3xl font-black text-cyber-neon">{stats.totalTeams}</span>
          <span className="text-[10px] text-cyber-muted block mt-1">CTF-TEAM-001 TO 050</span>
        </div>

        <div className="p-5 rounded-xl border border-cyber-border bg-cyber-card">
          <span className="text-[10px] text-cyber-muted uppercase block mb-1">Online Operatives</span>
          <span className="text-3xl font-black text-cyber-blue">
            {stats.onlineMembers} <span className="text-xs text-cyber-muted font-normal">/ 100 max</span>
          </span>
          <span className="text-[10px] text-cyber-muted block mt-1">CONCURRENT PARTICIPANTS</span>
        </div>

        <div className="p-5 rounded-xl border border-cyber-border bg-cyber-card">
          <span className="text-[10px] text-cyber-muted uppercase block mb-1">Flags Evaluated</span>
          <span className="text-3xl font-black text-cyber-amber">{stats.totalSubmissions}</span>
          <span className="text-[10px] text-cyber-muted block mt-1">{stats.totalSolves} VALID SOLVES</span>
        </div>

        <div className="p-5 rounded-xl border border-cyber-border bg-cyber-card">
          <span className="text-[10px] text-cyber-muted uppercase block mb-1">Policy Alerts</span>
          <span className={`text-3xl font-black ${stats.alertCount > 0 ? 'text-cyber-red animate-pulse' : 'text-cyber-text'}`}>
            {stats.alertCount}
          </span>
          <span className="text-[10px] text-cyber-muted block mt-1">FOCUS & TAB VIOLATIONS</span>
        </div>
      </div>

      {/* Real-time Alerts Console */}
      <div className="p-6 rounded-2xl border border-cyber-border bg-cyber-card space-y-4">
        <div className="flex items-center justify-between border-b border-cyber-border pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyber-red animate-pulse" />
            <h2 className="text-sm font-bold text-cyber-text uppercase tracking-wider">
              REAL-TIME SECURITY & TAB VIOLATION STREAM
            </h2>
          </div>
          <span className="text-[10px] text-cyber-muted">LIVE WEBSOCKET/SSE FEED</span>
        </div>

        {alerts.length === 0 ? (
          <div className="p-8 text-center text-xs text-cyber-muted border border-cyber-border/40 rounded-xl bg-cyber-bg/50">
            No active security incidents recorded in this session. Real-time violations will appear here automatically with audio alert chimes.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-96 overflow-y-auto">
            {alerts.map((al, idx) => (
              <div
                key={al.alertId || idx}
                className="p-3.5 bg-cyber-bg border border-cyber-red/40 rounded-xl flex items-center justify-between text-xs animate-in fade-in"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-cyber-red/20 text-cyber-red font-bold text-[10px]">
                    {al.severity}
                  </span>
                  <div>
                    <span className="font-bold text-cyber-text mr-2">{al.teamId} ({al.teamName})</span>
                    <span className="text-cyber-muted text-[11px]">{al.details}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-cyber-amber font-bold">{al.actionTaken}</span>
                  <Link
                    href="/admin/disciplinary"
                    className="px-2.5 py-1 rounded bg-cyber-card border border-cyber-border text-cyber-neon hover:border-cyber-neon text-[10px] font-bold"
                  >
                    REVIEW
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
