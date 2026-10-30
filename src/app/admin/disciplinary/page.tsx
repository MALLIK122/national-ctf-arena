"use client";

import React, { useEffect, useState } from "react";
import { 
  ShieldAlert, ShieldCheck, AlertOctagon, Users, RefreshCw, 
  RotateCcw, Lock, Search, Filter, Eye, CheckCircle2, AlertTriangle 
} from "lucide-react";
import { playCyberAlertSound } from "@/components/AudioAlert";

export default function DisciplinaryMonitoringPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/admin/teams");
      const data = await res.json();
      setTeams(data.teams || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();

    const es = new EventSource("/api/events");
    es.onmessage = (event) => {
      try {
        const p = JSON.parse(event.data);
        if (p.type === "SECURITY_ALERT" || p.type === "TEAM_STATUS_CHANGED") {
          playCyberAlertSound();
          fetchTeams();
        }
      } catch (e) {}
    };

    return () => es.close();
  }, []);

  const handleReinstate = async (teamId: string) => {
    const confirm = window.confirm(`Authorize official First Warning reinstatement for ${teamId}? This consumes their single warning opportunity.`);
    if (!confirm) return;

    setActionLoading(teamId);
    try {
      const res = await fetch("/api/admin/reinstate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId })
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
      else fetchTeams();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisqualify = async (teamId: string) => {
    const confirm = window.confirm(`CONFIRM PERMANENT DISQUALIFICATION for ${teamId}? Both operatives will be permanently locked out and their competition participation terminated.`);
    if (!confirm) return;

    setActionLoading(teamId);
    try {
      const res = await fetch("/api/admin/disqualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, action: "DISQUALIFY", reason: "Administrator manual disqualification." })
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
      else fetchTeams();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReverse = async (teamId: string) => {
    const confirm = window.confirm(`SUPER ADMIN OVERRIDE: Reverse penalty and restore ${teamId} to ACTIVE?`);
    if (!confirm) return;

    setActionLoading(teamId);
    try {
      const res = await fetch("/api/admin/disqualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, action: "REVERSE", reason: "Super Admin audit reversal." })
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
      else fetchTeams();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter & Search
  const filteredTeams = teams.filter(t => {
    if (filterStatus === "SUSPENDED" && t.disciplinary_status !== "WARNING_SUSPENDED") return false;
    if (filterStatus === "ACTIVE" && t.disciplinary_status !== "ACTIVE") return false;
    if (filterStatus === "WARNING_ISSUED" && t.disciplinary_status !== "WARNING_ISSUED") return false;
    if (filterStatus === "DISQUALIFIED" && t.disciplinary_status !== "DISQUALIFIED") return false;

    if (search) {
      const q = search.toLowerCase();
      return t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-8 font-mono">
      {/* Evidence Modal */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur p-4">
          <div className="max-w-lg w-full border border-cyber-border bg-cyber-card rounded-2xl p-6 text-xs space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-cyber-border pb-3">
              <span className="font-bold text-cyber-neon text-sm">VIOLATION EVIDENCE DOSSIER</span>
              <button onClick={() => setSelectedEvidence(null)} className="text-cyber-muted hover:text-cyber-text">✕</button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-cyber-muted">Team ID:</span>
                <span className="font-bold text-cyber-text">{selectedEvidence.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyber-muted">Squad Name:</span>
                <span className="font-bold text-cyber-text">{selectedEvidence.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyber-muted">Disciplinary Status:</span>
                <span className="font-bold text-cyber-amber">{selectedEvidence.disciplinary_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyber-muted">Warnings Consumed:</span>
                <span className="font-bold text-cyber-text">{selectedEvidence.warning_count} / 1</span>
              </div>
              <div className="pt-2 border-t border-cyber-border">
                <span className="text-cyber-muted block mb-1">INCIDENT REASON:</span>
                <p className="p-3 bg-cyber-bg rounded border border-cyber-border text-cyber-text leading-relaxed font-sans">
                  {selectedEvidence.suspension_reason || "Tab visibility lost or focus blur detected by client surveillance."}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedEvidence(null)}
              className="w-full py-2.5 rounded bg-cyber-bg border border-cyber-border hover:border-cyber-neon text-cyber-text font-bold"
            >
              Close Dossier
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cyber-border">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-cyber-amber">
            <ShieldAlert className="w-4 h-4" />
            <span>MANDATORY ANTI-CHEATING SURVEILLANCE & REINSTATEMENT</span>
          </div>
          <h1 className="text-3xl font-black text-cyber-text tracking-wide uppercase">
            TEAM DISCIPLINARY <span className="text-cyber-amber">MONITORING</span>
          </h1>
        </div>

        <button
          onClick={fetchTeams}
          className="px-4 py-2 rounded-lg border border-cyber-border bg-cyber-card hover:border-cyber-neon text-cyber-text text-xs font-bold flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>REFRESH MATRIX</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { key: "ALL", label: "All 50 Teams" },
            { key: "ACTIVE", label: "Active" },
            { key: "SUSPENDED", label: "Suspended (Warning 1)" },
            { key: "WARNING_ISSUED", label: "Warning Issued" },
            { key: "DISQUALIFIED", label: "Disqualified" }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                filterStatus === f.key
                  ? "bg-cyber-amber/15 border-cyber-amber text-cyber-amber font-bold"
                  : "bg-cyber-card border-cyber-border text-cyber-muted hover:text-cyber-text"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-cyber-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Team ID or name..."
            className="w-full bg-cyber-card border border-cyber-border focus:border-cyber-amber rounded-lg pl-10 pr-4 py-2 text-xs text-cyber-text outline-none"
          />
        </div>
      </div>

      {/* Disciplinary Table of All 50 Teams */}
      <div className="border border-cyber-border rounded-2xl bg-cyber-card overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cyber-bg border-b border-cyber-border text-[11px] text-cyber-muted uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Team Identifier</th>
                <th className="py-3.5 px-4">Member 1</th>
                <th className="py-3.5 px-4">Member 2</th>
                <th className="py-3.5 px-4">Violations</th>
                <th className="py-3.5 px-4">Warning Opportunity</th>
                <th className="py-3.5 px-4">Disciplinary Status</th>
                <th className="py-3.5 px-4">Score</th>
                <th className="py-3.5 px-4 text-right">Administrative Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/60">
              {filteredTeams.map((team) => {
                const isSuspended = team.disciplinary_status === "WARNING_SUSPENDED";
                const isDisqualified = team.disciplinary_status === "DISQUALIFIED";
                const isWarningIssued = team.disciplinary_status === "WARNING_ISSUED";

                const m1 = team.members?.find((m: any) => m.member_slot === 1);
                const m2 = team.members?.find((m: any) => m.member_slot === 2);

                return (
                  <tr
                    key={team.id}
                    className={`hover:bg-cyber-bg/50 transition-colors ${
                      isSuspended ? "bg-cyber-amber/[0.05]" :
                      isDisqualified ? "bg-cyber-red/[0.05]" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-cyber-text block">{team.id}</span>
                      <span className="text-[10px] text-cyber-muted">{team.name}</span>
                    </td>

                    {/* Member 1 Status */}
                    <td className="py-3.5 px-4 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${m1?.is_online ? 'bg-cyber-neon' : 'bg-cyber-border'}`} />
                        <span className="text-cyber-text font-medium">{m1?.name || "M1"}</span>
                      </div>
                      <span className="text-[9px] text-cyber-muted font-mono">{m1?.access_code}</span>
                    </td>

                    {/* Member 2 Status */}
                    <td className="py-3.5 px-4 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${m2?.is_online ? 'bg-cyber-neon' : 'bg-cyber-border'}`} />
                        <span className="text-cyber-text font-medium">{m2?.name || "M2"}</span>
                      </div>
                      <span className="text-[9px] text-cyber-muted font-mono">{m2?.access_code}</span>
                    </td>

                    {/* Violations Count */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        team.violation_count > 0 ? 'bg-cyber-red/20 text-cyber-red' : 'bg-cyber-bg text-cyber-muted'
                      }`}>
                        {team.violation_count || 0} INCIDENTS
                      </span>
                    </td>

                    {/* Warning Status (1 Warning Opportunity) */}
                    <td className="py-3.5 px-4 text-[11px]">
                      {team.warning_count === 0 ? (
                        <span className="text-cyber-neon font-bold">1 AVAILABLE</span>
                      ) : (
                        <span className="text-cyber-amber font-bold">CONSUMED (1/1)</span>
                      )}
                    </td>

                    {/* Disciplinary Status */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                        team.disciplinary_status === "ACTIVE"
                          ? "border border-cyber-neon/40 bg-cyber-neon/10 text-cyber-neon"
                          : isSuspended
                          ? "border border-cyber-amber bg-cyber-amber/20 text-cyber-amber animate-pulse"
                          : isDisqualified
                          ? "border border-cyber-red bg-cyber-red/20 text-cyber-red"
                          : "border border-cyber-amber/40 bg-cyber-amber/10 text-cyber-amber"
                      }`}>
                        {isDisqualified && <AlertOctagon className="w-3 h-3" />}
                        {isSuspended && <ShieldAlert className="w-3 h-3" />}
                        {team.disciplinary_status}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-4 font-black text-cyber-text">
                      {team.total_score} PTS
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Evidence Button */}
                        <button
                          onClick={() => setSelectedEvidence(team)}
                          className="px-2 py-1 rounded bg-cyber-bg border border-cyber-border hover:border-cyber-blue text-cyber-muted hover:text-cyber-blue text-[10px] font-bold"
                          title="View violation telemetry"
                        >
                          <Eye className="w-3.5 h-3.5 inline mr-1" />
                          Evidence
                        </button>

                        {/* CRITICAL BUTTON: "REINSTATE TEAM - FIRST WARNING" */}
                        {isSuspended && (
                          <button
                            onClick={() => handleReinstate(team.id)}
                            disabled={actionLoading === team.id}
                            className="px-3 py-1 rounded bg-cyber-amber text-cyber-bg hover:bg-cyber-amber/90 font-bold text-[10px] uppercase tracking-wider transition-all shadow-sm"
                          >
                            REINSTATE TEAM - FIRST WARNING
                          </button>
                        )}

                        {/* Disqualify Button */}
                        {!isDisqualified && (
                          <button
                            onClick={() => handleDisqualify(team.id)}
                            disabled={actionLoading === team.id}
                            className="px-2 py-1 rounded border border-cyber-red/40 hover:bg-cyber-red/10 text-cyber-red text-[10px] font-bold"
                          >
                            Disqualify
                          </button>
                        )}

                        {/* Super Admin Reversal */}
                        {isDisqualified && (
                          <button
                            onClick={() => handleReverse(team.id)}
                            disabled={actionLoading === team.id}
                            className="px-2 py-1 rounded bg-cyber-blue/10 border border-cyber-blue text-cyber-blue hover:bg-cyber-blue hover:text-cyber-bg text-[10px] font-bold"
                          >
                            Reverse DQ
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
