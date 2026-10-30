"use client";

import React, { useEffect, useState } from "react";
import { Flag, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    // Initial dummy data
    setSubmissions([
      {
        id: "SUB-INIT-1",
        teamId: "CTF-TEAM-001",
        challengeId: "NET-01",
        isCorrect: true,
        pointsAwarded: 100,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);

    const es = new EventSource("/api/events");
    es.onmessage = (event) => {
      try {
        const p = JSON.parse(event.data);
        if (p.type === "FLAG_SUBMISSION") {
          setSubmissions(prev => [p.payload, ...prev.slice(0, 50)]);
        }
      } catch (e) {}
    };

    return () => es.close();
  }, []);

  return (
    <div className="space-y-8 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cyber-border">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-cyber-neon">
            <Flag className="w-4 h-4" />
            <span>REAL-TIME EVALUATION FEED</span>
          </div>
          <h1 className="text-3xl font-black text-cyber-text tracking-wide uppercase">
            FLAG SUBMISSION <span className="text-cyber-neon">STREAM</span>
          </h1>
        </div>

        <span className="text-xs text-cyber-muted bg-cyber-card px-3 py-1.5 rounded-lg border border-cyber-border">
          STREAM BUFFER: 50 ENTRIES
        </span>
      </div>

      {/* Submissions Feed Table */}
      <div className="border border-cyber-border rounded-2xl bg-cyber-card overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cyber-bg border-b border-cyber-border text-[11px] text-cyber-muted uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Evaluation Result</th>
                <th className="py-3.5 px-4">Team Identifier</th>
                <th className="py-3.5 px-4">Challenge</th>
                <th className="py-3.5 px-4">Points</th>
                <th className="py-3.5 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/60">
              {submissions.map((sub, idx) => (
                <tr key={sub.submissionId || idx} className="hover:bg-cyber-bg/50 transition-colors animate-in fade-in">
                  <td className="py-3.5 px-4">
                    {sub.isCorrect ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyber-neon/10 border border-cyber-neon/30 text-cyber-neon font-bold text-[10px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        CORRECT FLAG
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyber-red/10 border border-cyber-red/30 text-cyber-red font-bold text-[10px]">
                        <XCircle className="w-3.5 h-3.5" />
                        INCORRECT ATTEMPT
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-cyber-text">
                    {sub.teamId}
                  </td>
                  <td className="py-3.5 px-4 text-cyber-blue font-bold">
                    {sub.challengeId}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-cyber-text">
                    {sub.isCorrect ? `+${sub.pointsAwarded || 100} PTS` : "0 PTS"}
                  </td>
                  <td className="py-3.5 px-4 text-right text-cyber-muted text-[11px]">
                    {sub.timestamp ? new Date(sub.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
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
