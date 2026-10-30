"use client";

import React, { useEffect, useState } from "react";
import { 
  Trophy, Medal, Award, Flame, Shield, Clock, 
  Lock, AlertOctagon, ShieldAlert, Users, ArrowUp 
} from "lucide-react";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = () => {
    fetch("/api/leaderboard")
      .then(res => res.json())
      .then(data => {
        setLeaderboard(data.leaderboard || []);
        setStatistics(data.statistics || null);
        setIsFrozen(Boolean(data.isFrozen));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeaderboard();

    // Listen to real-time solve and score updates
    const es = new EventSource("/api/events");
    es.onmessage = (event) => {
      try {
        const p = JSON.parse(event.data);
        if (p.type === "LEADERBOARD_UPDATE" || p.type === "LEADERBOARD_FROZEN") {
          fetchLeaderboard();
        }
      } catch (e) {}
    };

    return () => es.close();
  }, []);

  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-cyber-border">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-cyber-amber">
            <Trophy className="w-4 h-4 text-cyber-amber" />
            <span>REAL-TIME SCORING TELEMETRY • TIE-BREAKING ALGORITHM</span>
          </div>
          <h1 className="text-3xl font-black text-cyber-text tracking-wide uppercase">
            CHAMPIONSHIP <span className="text-cyber-neon">LEADERBOARD</span>
          </h1>
        </div>

        {isFrozen && (
          <div className="px-4 py-2 rounded-xl bg-cyber-blue/10 border border-cyber-blue text-cyber-blue text-xs font-bold flex items-center gap-2 animate-pulse">
            <Lock className="w-4 h-4" />
            <span>LEADERBOARD FROZEN BY ADMINISTRATOR</span>
          </div>
        )}
      </div>

      {/* Top 3 Podium Highlights */}
      {!loading && top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* 2nd Place */}
          {top3[1] && (
            <div className="p-6 rounded-2xl border border-cyber-border bg-cyber-card flex flex-col items-center text-center relative overflow-hidden order-2 md:order-1 mt-0 md:mt-6">
              <div className="w-12 h-12 rounded-full bg-slate-400/10 border border-slate-400 flex items-center justify-center text-slate-300 font-black text-lg mb-3">
                #2
              </div>
              <span className="text-xs text-cyber-muted font-bold uppercase">{top3[1].id}</span>
              <h3 className="font-bold text-base text-cyber-text mb-2 truncate max-w-full">{top3[1].name}</h3>
              <span className="text-2xl font-black text-cyber-blue">{top3[1].score} PTS</span>
              <span className="text-[10px] text-cyber-muted mt-1">{top3[1].solves} Solves</span>
            </div>
          )}

          {/* 1st Place Champion */}
          {top3[0] && (
            <div className="p-6 rounded-2xl border border-cyber-neon bg-cyber-neon/[0.04] shadow-neon flex flex-col items-center text-center relative overflow-hidden order-1 md:order-2 scale-105 z-10">
              <div className="absolute top-0 right-0 left-0 h-1 bg-cyber-neon animate-pulse" />
              <div className="w-14 h-14 rounded-full bg-cyber-neon/20 border border-cyber-neon flex items-center justify-center text-cyber-neon font-black text-xl mb-3 shadow-neon">
                <Trophy className="w-7 h-7" />
              </div>
              <span className="text-xs text-cyber-neon font-bold uppercase tracking-wider">{top3[0].id}</span>
              <h3 className="font-bold text-lg text-cyber-text mb-2 truncate max-w-full">{top3[0].name}</h3>
              <span className="text-3xl font-black text-cyber-neon text-shadow-neon">{top3[0].score} PTS</span>
              <span className="text-xs text-cyber-muted mt-1 font-bold">{top3[0].solves} Challenges Solved</span>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div className="p-6 rounded-2xl border border-cyber-border bg-cyber-card flex flex-col items-center text-center relative overflow-hidden order-3 mt-0 md:mt-6">
              <div className="w-12 h-12 rounded-full bg-amber-600/10 border border-amber-600 flex items-center justify-center text-amber-500 font-black text-lg mb-3">
                #3
              </div>
              <span className="text-xs text-cyber-muted font-bold uppercase">{top3[2].id}</span>
              <h3 className="font-bold text-base text-cyber-text mb-2 truncate max-w-full">{top3[2].name}</h3>
              <span className="text-2xl font-black text-cyber-amber">{top3[2].score} PTS</span>
              <span className="text-[10px] text-cyber-muted mt-1">{top3[2].solves} Solves</span>
            </div>
          )}
        </div>
      )}

      {/* Main Leaderboard Table */}
      <div className="border border-cyber-border rounded-2xl bg-cyber-card overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cyber-bg border-b border-cyber-border text-[11px] text-cyber-muted uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Rank</th>
                <th className="py-3.5 px-4">Team Identifier</th>
                <th className="py-3.5 px-4">Squad Name</th>
                <th className="py-3.5 px-4">Score</th>
                <th className="py-3.5 px-4">Solves</th>
                <th className="py-3.5 px-4">Last Solved At</th>
                <th className="py-3.5 px-4 text-right">Integrity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/60">
              {leaderboard.map(team => (
                <tr
                  key={team.id}
                  className={`hover:bg-cyber-bg/50 transition-colors ${
                    team.rank === 1 ? "bg-cyber-neon/[0.02]" : ""
                  }`}
                >
                  <td className="py-3.5 px-4 font-bold">
                    <span className={`inline-block w-6 text-center ${
                      team.rank === 1 ? "text-cyber-neon text-sm font-black" :
                      team.rank === 2 ? "text-cyber-blue font-bold" :
                      team.rank === 3 ? "text-cyber-amber font-bold" : "text-cyber-muted"
                    }`}>
                      #{team.rank}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-cyber-neon">
                    {team.id}
                  </td>
                  <td className="py-3.5 px-4 text-cyber-text font-bold">
                    {team.name}
                  </td>
                  <td className="py-3.5 px-4 font-black text-sm text-cyber-text">
                    {team.score}
                  </td>
                  <td className="py-3.5 px-4 text-cyber-muted">
                    {team.solves} solved
                  </td>
                  <td className="py-3.5 px-4 text-cyber-muted text-[11px]">
                    {team.lastSolveAt ? new Date(team.lastSolveAt).toLocaleTimeString() : "—"}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                      team.status === "ACTIVE"
                        ? "border border-cyber-neon/30 bg-cyber-neon/10 text-cyber-neon"
                        : team.status === "WARNING_SUSPENDED"
                        ? "border border-cyber-amber bg-cyber-amber/20 text-cyber-amber animate-pulse"
                        : team.status === "DISQUALIFIED"
                        ? "border border-cyber-red bg-cyber-red/20 text-cyber-red animate-pulse"
                        : "border border-cyber-amber/30 bg-cyber-amber/10 text-cyber-amber"
                    }`}>
                      {team.status === "DISQUALIFIED" && <AlertOctagon className="w-3 h-3" />}
                      {team.status === "WARNING_SUSPENDED" && <ShieldAlert className="w-3 h-3" />}
                      {team.status}
                    </span>
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
