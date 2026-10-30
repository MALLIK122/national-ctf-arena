"use client";

import React, { useEffect, useState } from "react";
import { Terminal, Square, RotateCcw, Cpu, HardDrive, RefreshCw } from "lucide-react";

export default function AdminLabsPage() {
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLabs = () => {
    // Fetch all active lab instances
    fetch("/api/admin/teams")
      .then(() => {
        // Mock sample active pods
        setLabs([
          {
            id: "LAB-CTF-TEAM-001-NET-01",
            teamId: "CTF-TEAM-001",
            challengeId: "NET-01",
            targetIp: "10.10.14.22",
            targetPort: 8088,
            status: "RUNNING",
            startedAt: new Date(Date.now() - 15 * 60000).toISOString(),
            expiresInMins: 45,
            cpu: "0.12 vCPU (24%)",
            memory: "68 MB / 256 MB"
          },
          {
            id: "LAB-CTF-TEAM-004-EXP-01",
            teamId: "CTF-TEAM-004",
            challengeId: "EXP-01",
            targetIp: "10.10.15.28",
            targetPort: 8090,
            status: "RUNNING",
            startedAt: new Date(Date.now() - 25 * 60000).toISOString(),
            expiresInMins: 35,
            cpu: "0.08 vCPU (16%)",
            memory: "82 MB / 256 MB"
          }
        ]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  const handleStopLab = (id: string) => {
    setLabs(prev => prev.filter(l => l.id !== id));
  };

  return (
    <div className="space-y-8 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cyber-border">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-cyber-blue">
            <Terminal className="w-4 h-4" />
            <span>CONTAINER ORCHESTRATION & ISOLATION TELEMETRY</span>
          </div>
          <h1 className="text-3xl font-black text-cyber-text tracking-wide uppercase">
            LIVE LAB <span className="text-cyber-blue">MONITORING</span>
          </h1>
        </div>

        <button
          onClick={fetchLabs}
          className="px-4 py-2 rounded-lg border border-cyber-border bg-cyber-card hover:border-cyber-blue text-cyber-text text-xs font-bold flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>REFRESH CONTAINERS</span>
        </button>
      </div>

      {/* Quotas & Resource Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl border border-cyber-border bg-cyber-card">
          <span className="text-cyber-muted uppercase text-[10px] block mb-1">Active Containers</span>
          <span className="text-2xl font-black text-cyber-neon">{labs.length}</span>
          <span className="text-[10px] text-cyber-muted block mt-1">ISOLATED SANDBOX PODS</span>
        </div>

        <div className="p-4 rounded-xl border border-cyber-border bg-cyber-card">
          <span className="text-cyber-muted uppercase text-[10px] block mb-1">Max Allocation Quota</span>
          <span className="text-2xl font-black text-cyber-blue">50 PODS</span>
          <span className="text-[10px] text-cyber-muted block mt-1">1 TARGET POD PER TEAM</span>
        </div>

        <div className="p-4 rounded-xl border border-cyber-border bg-cyber-card">
          <span className="text-cyber-muted uppercase text-[10px] block mb-1">Security Isolation</span>
          <span className="text-2xl font-black text-cyber-amber">STRICT CGROUP</span>
          <span className="text-[10px] text-cyber-muted block mt-1">NETWORK BRIDGE SEGREGATED</span>
        </div>
      </div>

      {/* Labs Table */}
      <div className="border border-cyber-border rounded-2xl bg-cyber-card overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cyber-bg border-b border-cyber-border text-[11px] text-cyber-muted uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Pod Identifier</th>
                <th className="py-3.5 px-4">Assigned Team</th>
                <th className="py-3.5 px-4">Challenge</th>
                <th className="py-3.5 px-4">Target IP:Port</th>
                <th className="py-3.5 px-4">Remaining</th>
                <th className="py-3.5 px-4">CPU / RAM</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/60">
              {labs.map((lab) => (
                <tr key={lab.id} className="hover:bg-cyber-bg/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-cyber-text">
                    {lab.id}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-cyber-neon">
                    {lab.teamId}
                  </td>
                  <td className="py-3.5 px-4 text-cyber-blue font-bold">
                    {lab.challengeId}
                  </td>
                  <td className="py-3.5 px-4 text-cyber-text">
                    {lab.targetIp}:{lab.targetPort}
                  </td>
                  <td className="py-3.5 px-4 text-cyber-muted">
                    {lab.expiresInMins} mins
                  </td>
                  <td className="py-3.5 px-4 text-cyber-muted text-[11px]">
                    {lab.cpu} • {lab.memory}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleStopLab(lab.id)}
                      className="px-2.5 py-1 rounded bg-cyber-red/10 border border-cyber-red/40 hover:bg-cyber-red hover:text-cyber-bg text-cyber-red text-[10px] font-bold transition-colors"
                    >
                      <Square className="w-3 h-3 inline mr-1" />
                      Terminate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
