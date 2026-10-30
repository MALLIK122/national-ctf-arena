"use client";

import React, { useEffect, useState } from "react";
import { Users, Download, Key, RotateCcw, Search, Shield, Check } from "lucide-react";

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [resetModal, setResetModal] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");

  const fetchTeams = () => {
    fetch("/api/admin/teams")
      .then(res => res.json())
      .then(d => setTeams(d.teams || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleResetPassword = async (teamId: string) => {
    if (!newPassword.trim()) return;
    try {
      const res = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESET_PASSWORD", teamId, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setResetModal(null);
        setNewPassword("");
        fetchTeams();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleResetProgress = async (teamId: string) => {
    const confirm = window.confirm(`Reset ALL score, solves, and progress for ${teamId}?`);
    if (!confirm) return;

    try {
      const res = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESET_PROGRESS", teamId })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchTeams();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filteredTeams = teams.filter(t => {
    if (search) {
      const q = search.toLowerCase();
      return t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-8 font-mono">
      {/* Password Reset Modal */}
      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur p-4">
          <div className="max-w-md w-full border border-cyber-border bg-cyber-card rounded-2xl p-6 text-xs space-y-4">
            <h3 className="font-bold text-cyber-text text-sm">
              RESET PASSWORD: {resetModal.id}
            </h3>
            <p className="text-cyber-muted text-[11px]">
              Set a new secure access passphrase for {resetModal.name}.
            </p>
            <input
              type="text"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New secure passphrase..."
              className="w-full bg-cyber-bg border border-cyber-border rounded px-3 py-2 text-cyber-neon outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setResetModal(null)}
                className="px-3 py-1.5 rounded border border-cyber-border text-cyber-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResetPassword(resetModal.id)}
                className="px-4 py-1.5 rounded bg-cyber-neon text-cyber-bg font-bold"
              >
                Save Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cyber-border">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-cyber-neon">
            <Users className="w-4 h-4" />
            <span>ROSTER DIRECTORY • 50 SQUADS</span>
          </div>
          <h1 className="text-3xl font-black text-cyber-text tracking-wide uppercase">
            TEAM <span className="text-cyber-neon">MANAGEMENT</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/auth/export-credentials"
            className="px-4 py-2 rounded-lg bg-cyber-neon text-cyber-bg hover:bg-cyber-neon/90 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD 50 TEAMS CREDENTIALS CSV</span>
          </a>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative w-full max-w-sm">
        <Search className="w-4 h-4 text-cyber-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Team ID or name..."
          className="w-full bg-cyber-card border border-cyber-border focus:border-cyber-neon rounded-lg pl-10 pr-4 py-2 text-xs text-cyber-text outline-none"
        />
      </div>

      {/* Teams Table */}
      <div className="border border-cyber-border rounded-2xl bg-cyber-card overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cyber-bg border-b border-cyber-border text-[11px] text-cyber-muted uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Team Identifier</th>
                <th className="py-3.5 px-4">Squad Name</th>
                <th className="py-3.5 px-4">Member 1 Code</th>
                <th className="py-3.5 px-4">Member 2 Code</th>
                <th className="py-3.5 px-4">Score</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/60">
              {filteredTeams.map((team) => {
                const m1 = team.members?.find((m: any) => m.member_slot === 1);
                const m2 = team.members?.find((m: any) => m.member_slot === 2);

                return (
                  <tr key={team.id} className="hover:bg-cyber-bg/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-cyber-neon">
                      {team.id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-cyber-text">
                      {team.name}
                    </td>
                    <td className="py-3.5 px-4 text-cyber-muted text-[11px]">
                      {m1?.access_code} ({m1?.name})
                    </td>
                    <td className="py-3.5 px-4 text-cyber-muted text-[11px]">
                      {m2?.access_code} ({m2?.name})
                    </td>
                    <td className="py-3.5 px-4 font-bold text-cyber-text">
                      {team.total_score} PTS
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-cyber-border bg-cyber-bg text-cyber-muted">
                        {team.disciplinary_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setResetModal(team)}
                          className="px-2 py-1 rounded border border-cyber-border hover:border-cyber-blue text-cyber-muted hover:text-cyber-blue text-[10px] font-bold"
                        >
                          <Key className="w-3 h-3 inline mr-1" />
                          Password
                        </button>

                        <button
                          onClick={() => handleResetProgress(team.id)}
                          className="px-2 py-1 rounded border border-cyber-border hover:border-cyber-red text-cyber-muted hover:text-cyber-red text-[10px] font-bold"
                        >
                          <RotateCcw className="w-3 h-3 inline mr-1" />
                          Reset Progress
                        </button>
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
