"use client";

import React, { useEffect, useState } from "react";
import { 
  Clock, Play, Pause, Square, Lock, Unlock, 
  Send, AlertTriangle, ShieldCheck 
} from "lucide-react";

export default function AdminSettingsPage() {
  const [timerData, setTimerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Announcement state
  const [annTitle, setAnnTitle] = useState("");
  const [annMessage, setAnnMessage] = useState("");
  const [annPriority, setAnnPriority] = useState("NORMAL");
  const [annSuccess, setAnnSuccess] = useState(false);

  const fetchTimer = () => {
    fetch("/api/admin/timer")
      .then(res => res.json())
      .then(d => setTimerData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTimer();
  }, []);

  const handleTimerAction = async (action: string) => {
    try {
      const res = await fetch("/api/admin/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (res.ok) {
        fetchTimer();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleToggleFreeze = async () => {
    try {
      const res = await fetch("/api/admin/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_FREEZE" })
      });
      const data = await res.json();
      if (res.ok) {
        fetchTimer();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) return;

    try {
      const res = await fetch("/api/admin/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: annTitle,
          message: annMessage,
          priority: annPriority
        })
      });

      if (res.ok) {
        setAnnSuccess(true);
        setAnnTitle("");
        setAnnMessage("");
        setTimeout(() => setAnnSuccess(false), 4000);
      }
    } catch (e) {}
  };

  return (
    <div className="space-y-8 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cyber-border">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-cyber-neon">
            <Clock className="w-4 h-4" />
            <span>GLOBAL LIFECYCLE CONTROLS</span>
          </div>
          <h1 className="text-3xl font-black text-cyber-text tracking-wide uppercase">
            EVENT CONTROL & <span className="text-cyber-neon">3-HOUR TIMER</span>
          </h1>
        </div>
      </div>

      {/* Timer Controls Box */}
      <div className="p-6 rounded-2xl border border-cyber-border bg-cyber-card space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cyber-border">
          <div>
            <h2 className="text-sm font-bold text-cyber-text uppercase tracking-wider">
              3-Hour Championship Event Countdown
            </h2>
            <p className="text-xs text-cyber-muted mt-0.5">
              Current State: <span className="font-bold text-cyber-neon">{timerData?.status || "WAITING"}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {timerData?.status !== "RUNNING" ? (
              <button
                onClick={() => handleTimerAction(timerData?.status === "PAUSED" ? "RESUME" : "START")}
                className="px-4 py-2 rounded-lg bg-cyber-neon text-cyber-bg font-bold flex items-center gap-2 hover:bg-cyber-neon/90"
              >
                <Play className="w-4 h-4" />
                <span>{timerData?.status === "PAUSED" ? "RESUME TIMER" : "START 3-HOUR EVENT"}</span>
              </button>
            ) : (
              <button
                onClick={() => handleTimerAction("PAUSE")}
                className="px-4 py-2 rounded-lg bg-cyber-amber text-cyber-bg font-bold flex items-center gap-2 hover:bg-cyber-amber/90"
              >
                <Pause className="w-4 h-4" />
                <span>PAUSE ARENA</span>
              </button>
            )}

            <button
              onClick={() => handleTimerAction("END")}
              className="px-4 py-2 rounded-lg border border-cyber-red/50 bg-cyber-red/10 text-cyber-red hover:bg-cyber-red hover:text-cyber-bg transition-colors font-bold flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              <span>TERMINATE EVENT</span>
            </button>

            <button
              onClick={handleToggleFreeze}
              className={`px-4 py-2 rounded-lg border font-bold flex items-center gap-2 transition-colors ${
                timerData?.isLeaderboardFrozen
                  ? "bg-cyber-blue text-cyber-bg border-cyber-blue"
                  : "border-cyber-border text-cyber-muted hover:text-cyber-text"
              }`}
            >
              {timerData?.isLeaderboardFrozen ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              <span>{timerData?.isLeaderboardFrozen ? "LEADERBOARD FROZEN" : "FREEZE LEADERBOARD"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-cyber-bg rounded-xl border border-cyber-border">
            <span className="text-cyber-muted uppercase text-[10px] block mb-1">Duration</span>
            <span className="text-xl font-black text-cyber-text">180 MINUTES (3 HOURS)</span>
          </div>

          <div className="p-4 bg-cyber-bg rounded-xl border border-cyber-border">
            <span className="text-cyber-muted uppercase text-[10px] block mb-1">Submissions</span>
            <span className={`text-xl font-black ${timerData?.allowSubmissions ? 'text-cyber-neon' : 'text-cyber-red'}`}>
              {timerData?.allowSubmissions ? "ENABLED" : "LOCKED"}
            </span>
          </div>

          <div className="p-4 bg-cyber-bg rounded-xl border border-cyber-border">
            <span className="text-cyber-muted uppercase text-[10px] block mb-1">Time Elapsed Action</span>
            <span className="text-xs text-cyber-muted block mt-1">
              Automatic flag freeze, active lab cleanup, scores preserved.
            </span>
          </div>
        </div>
      </div>

      {/* Emergency Broadcast Announcement Box */}
      <div className="p-6 rounded-2xl border border-cyber-border bg-cyber-card space-y-4">
        <h2 className="text-sm font-bold text-cyber-text uppercase tracking-wider flex items-center gap-2 border-b border-cyber-border pb-3">
          <Send className="w-4 h-4 text-cyber-blue" />
          <span>Broadcast Operational Announcement</span>
        </h2>

        {annSuccess && (
          <div className="p-3 rounded-lg bg-cyber-neon/10 border border-cyber-neon/30 text-cyber-neon text-xs">
            Announcement broadcast successfully to all participant terminals.
          </div>
        )}

        <form onSubmit={handleSendAnnouncement} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-cyber-muted uppercase text-[10px] mb-1">Subject Header</label>
              <input
                type="text"
                required
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="e.g. LAB MAINTENANCE / HINT UPDATES"
                className="w-full bg-cyber-bg border border-cyber-border rounded px-3 py-2 text-cyber-text outline-none"
              />
            </div>

            <div>
              <label className="block text-cyber-muted uppercase text-[10px] mb-1">Priority Classification</label>
              <select
                value={annPriority}
                onChange={(e) => setAnnPriority(e.target.value)}
                className="w-full bg-cyber-bg border border-cyber-border rounded px-3 py-2 text-cyber-text outline-none"
              >
                <option value="NORMAL">NORMAL BULLETIN</option>
                <option value="URGENT">URGENT ADVISORY</option>
                <option value="CRITICAL">EMERGENCY DIRECTIVE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-cyber-muted uppercase text-[10px] mb-1">Message Content</label>
            <textarea
              required
              rows={3}
              value={annMessage}
              onChange={(e) => setAnnMessage(e.target.value)}
              placeholder="Enter bulletin text to broadcast across all operative screens..."
              className="w-full bg-cyber-bg border border-cyber-border rounded px-3 py-2 text-cyber-text outline-none"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-cyber-blue text-cyber-bg hover:bg-cyber-blue/90 font-bold text-xs uppercase tracking-wider flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>TRANSMIT BULLETIN</span>
          </button>
        </form>
      </div>
    </div>
  );
}
