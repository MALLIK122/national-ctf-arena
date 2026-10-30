"use client";

import React from "react";
import { FileSpreadsheet, Download, ShieldAlert, Trophy, Users } from "lucide-react";

export default function AdminReportsPage() {
  return (
    <div className="space-y-8 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cyber-border">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-cyber-neon">
            <FileSpreadsheet className="w-4 h-4" />
            <span>EXPORT DIRECTORY & AUDIT TELEMETRY</span>
          </div>
          <h1 className="text-3xl font-black text-cyber-text tracking-wide uppercase">
            REPORTS & <span className="text-cyber-neon">EXPORTS</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Report 1 */}
        <div className="p-6 rounded-2xl border border-cyber-border bg-cyber-card flex flex-col justify-between">
          <div>
            <div className="p-3 rounded-xl bg-cyber-neon/10 border border-cyber-neon/30 text-cyber-neon w-fit mb-4">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-cyber-text mb-2">
              Final Leaderboard Standings
            </h3>
            <p className="text-xs text-cyber-muted leading-relaxed mb-6">
              Official ranked standings including points, tie-breaker timestamps, solve counts, and final disciplinary states.
            </p>
          </div>

          <a
            href="/api/admin/reports?type=leaderboard"
            className="w-full py-2.5 rounded-lg bg-cyber-neon text-cyber-bg font-bold text-xs uppercase tracking-wider hover:bg-cyber-neon/90 text-center flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT LEADERBOARD (CSV)</span>
          </a>
        </div>

        {/* Report 2 */}
        <div className="p-6 rounded-2xl border border-cyber-border bg-cyber-card flex flex-col justify-between">
          <div>
            <div className="p-3 rounded-xl bg-cyber-amber/10 border border-cyber-amber/30 text-cyber-amber w-fit mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-cyber-text mb-2">
              Disciplinary & Anti-Cheat Audit
            </h3>
            <p className="text-xs text-cyber-muted leading-relaxed mb-6">
              Complete historical record of tab switches, focus loss incidents, automated suspensions, warnings consumed, and administrative rulings.
            </p>
          </div>

          <a
            href="/api/admin/reports?type=disciplinary"
            className="w-full py-2.5 rounded-lg bg-cyber-amber text-cyber-bg font-bold text-xs uppercase tracking-wider hover:bg-cyber-amber/90 text-center flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT AUDIT LOG (CSV)</span>
          </a>
        </div>

        {/* Report 3 */}
        <div className="p-6 rounded-2xl border border-cyber-border bg-cyber-card flex flex-col justify-between">
          <div>
            <div className="p-3 rounded-xl bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue w-fit mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-cyber-text mb-2">
              50 Team Credentials Package
            </h3>
            <p className="text-xs text-cyber-muted leading-relaxed mb-6">
              Secure roster containing all 50 Team IDs, unique passwords, Member 1 access codes, and Member 2 access codes for event distribution.
            </p>
          </div>

          <a
            href="/api/auth/export-credentials"
            className="w-full py-2.5 rounded-lg bg-cyber-blue text-cyber-bg font-bold text-xs uppercase tracking-wider hover:bg-cyber-blue/90 text-center flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT CREDENTIALS (CSV)</span>
          </a>
        </div>
      </div>
    </div>
  );
}
