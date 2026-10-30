"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Flag, Search, Filter, Terminal, Lock, CheckCircle2, 
  Cpu, Shield, Zap, Key, ArrowRight 
} from "lucide-react";

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/challenges")
      .then(res => res.json())
      .then(data => setChallenges(data.challenges || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    { key: "ALL", label: "All Disciplines" },
    { key: "NETWORK_PENETRATION", label: "Network Recon & Pivot" },
    { key: "EXPLOITATION", label: "Exploitation & Web" },
    { key: "CRYPTOGRAPHY", label: "Cryptography" },
    { key: "DIGITAL_FORENSICS", label: "Digital Forensics" }
  ];

  const difficulties = ["ALL", "EASY", "MEDIUM", "HARD", "EXPERT"];

  const filteredChallenges = challenges.filter(c => {
    if (selectedCategory !== "ALL" && c.category !== selectedCategory) return false;
    if (selectedDifficulty !== "ALL" && c.difficulty !== selectedDifficulty) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return c.title.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-cyber-border">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-cyber-muted">
            <Flag className="w-4 h-4 text-cyber-neon" />
            <span>OPERATIONAL REPERTOIRE • 26 TECHNICAL TARGETS</span>
          </div>
          <h1 className="text-3xl font-black text-cyber-text tracking-wide uppercase">
            CHALLENGE <span className="text-cyber-neon">DIRECTORY</span>
          </h1>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-cyber-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search targets or IDs..."
            className="w-full bg-cyber-card border border-cyber-border focus:border-cyber-neon rounded-lg pl-10 pr-4 py-2 text-xs text-cyber-text outline-none transition-colors"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 text-xs">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                selectedCategory === cat.key
                  ? "bg-cyber-neon/10 border-cyber-neon text-cyber-neon shadow-neon"
                  : "bg-cyber-card border-cyber-border text-cyber-muted hover:text-cyber-text"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Difficulty Filter */}
        <div className="flex items-center gap-1.5 text-xs bg-cyber-card border border-cyber-border p-1 rounded-lg">
          <span className="text-cyber-muted px-2">DIFFICULTY:</span>
          {difficulties.map(diff => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                selectedDifficulty === diff
                  ? "bg-cyber-neon text-cyber-bg"
                  : "text-cyber-muted hover:text-cyber-text"
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Challenges */}
      {loading ? (
        <div className="text-center py-20 text-xs text-cyber-neon">
          FETCHING CLASSIFIED DIRECTORY...
        </div>
      ) : filteredChallenges.length === 0 ? (
        <div className="text-center py-20 border border-cyber-border bg-cyber-card rounded-2xl p-8 text-xs text-cyber-muted">
          No challenges match the active filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChallenges.map(chal => {
            const isSolved = chal.isSolved;
            const isLocked = chal.team_status === "LOCKED";

            return (
              <div
                key={chal.id}
                className={`p-6 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                  isSolved
                    ? "border-cyber-neon/60 bg-cyber-neon/[0.03] shadow-sm"
                    : isLocked
                    ? "border-cyber-border/40 bg-cyber-bg/60 opacity-60"
                    : "border-cyber-border bg-cyber-card hover:border-cyber-blue/60"
                }`}
              >
                {/* Status Indicator Bar */}
                {isSolved && (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-cyber-neon text-cyber-bg text-[10px] font-bold rounded-bl-lg flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>SOLVED</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="px-2 py-0.5 rounded bg-cyber-bg border border-cyber-border text-cyber-neon font-bold text-[11px]">
                      {chal.id}
                    </span>
                    <span className="text-cyber-amber font-bold text-sm">
                      {chal.points} PTS
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-cyber-text mb-1 line-clamp-1">
                    {chal.title}
                  </h3>

                  <div className="flex items-center gap-2 text-[10px] text-cyber-muted uppercase mb-4">
                    <span className={`font-bold ${
                      chal.difficulty === "EASY" ? "text-cyber-neon" :
                      chal.difficulty === "MEDIUM" ? "text-cyber-blue" :
                      chal.difficulty === "HARD" ? "text-cyber-amber" : "text-cyber-red"
                    }`}>
                      {chal.difficulty}
                    </span>
                    <span>•</span>
                    <span>{chal.estimated_time_mins} MINS</span>
                    <span>•</span>
                    <span className="truncate">{chal.category.replace("_", " ")}</span>
                  </div>

                  <p className="text-xs text-cyber-muted leading-relaxed line-clamp-3 mb-6">
                    {chal.description}
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-cyber-border">
                  {chal.hasLiveLab && (
                    <div className="flex items-center gap-1.5 text-[10px] text-cyber-blue">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Interactive Browser Lab Target</span>
                    </div>
                  )}

                  {isLocked ? (
                    <div className="w-full py-2.5 rounded-lg bg-cyber-bg border border-cyber-border text-cyber-muted text-xs font-bold text-center flex items-center justify-center gap-2">
                      <Lock className="w-3.5 h-3.5" />
                      <span>PREREQUISITES REQUIRED</span>
                    </div>
                  ) : (
                    <Link
                      href={`/challenges/${chal.id}`}
                      className={`w-full py-2.5 rounded-lg text-xs font-bold text-center transition-all flex items-center justify-center gap-2 ${
                        isSolved
                          ? "border border-cyber-neon/40 bg-cyber-neon/10 text-cyber-neon hover:bg-cyber-neon hover:text-cyber-bg"
                          : "bg-cyber-neon text-cyber-bg hover:bg-cyber-neon/90 hover:shadow-neon"
                      }`}
                    >
                      <span>{isSolved ? "REVIEW SOLUTION" : "LAUNCH CHALLENGE"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
