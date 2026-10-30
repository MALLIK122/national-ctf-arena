"use client";

import React from "react";
import { AlertOctagon, ShieldAlert, Lock, AlertTriangle } from "lucide-react";

interface SuspensionModalProps {
  status: "WARNING_SUSPENDED" | "DISQUALIFIED" | string;
  reason?: string;
  teamId?: string;
}

export default function SuspensionModal({ status, reason, teamId }: SuspensionModalProps) {
  if (status !== "WARNING_SUSPENDED" && status !== "DISQUALIFIED") {
    return null;
  }

  const isDisqualified = status === "DISQUALIFIED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className={`max-w-xl w-full border ${isDisqualified ? 'border-cyber-red bg-cyber-card/95 shadow-red' : 'border-cyber-amber bg-cyber-card/95 shadow-lg shadow-amber-500/20'} rounded-xl p-8 text-center relative overflow-hidden`}>
        {/* Top Warning Glow Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${isDisqualified ? 'bg-cyber-red animate-pulse' : 'bg-cyber-amber animate-pulse'}`} />

        <div className="flex justify-center mb-6">
          <div className={`p-4 rounded-full ${isDisqualified ? 'bg-cyber-red/20 text-cyber-red' : 'bg-cyber-amber/20 text-cyber-amber'} animate-bounce`}>
            {isDisqualified ? <AlertOctagon className="w-14 h-14" /> : <ShieldAlert className="w-14 h-14" />}
          </div>
        </div>

        <h2 className={`text-2xl font-black font-mono tracking-wider mb-3 ${isDisqualified ? 'text-cyber-red' : 'text-cyber-amber'}`}>
          {isDisqualified ? "TEAM DISQUALIFIED" : "TEAM SUSPENDED"}
        </h2>

        <div className="border border-cyber-border bg-cyber-bg/80 rounded-lg p-4 mb-6 font-mono text-sm text-left text-cyber-text space-y-2">
          <div className="flex justify-between border-b border-cyber-border pb-1 text-xs text-cyber-muted">
            <span>TEAM IDENTIFIER</span>
            <span className="font-bold text-cyber-neon">{teamId || "CONFIDENTIAL"}</span>
          </div>
          <div className="flex justify-between border-b border-cyber-border pb-1 text-xs text-cyber-muted">
            <span>POLICY STATUS</span>
            <span className={`font-bold ${isDisqualified ? 'text-cyber-red' : 'text-cyber-amber'}`}>
              {status}
            </span>
          </div>
          <div className="pt-1 text-xs">
            <span className="text-cyber-muted">INCIDENT LOG: </span>
            <span className="text-cyber-text">{reason || "Tab switch or unauthorized focus loss recorded."}</span>
          </div>
        </div>

        <p className="text-base text-cyber-text font-sans font-medium mb-6 leading-relaxed">
          {isDisqualified ? (
            "TEAM DISQUALIFIED: Your team has exceeded the permitted competition policy violations. Contact the competition administrator."
          ) : (
            "TEAM SUSPENDED: A competition policy violation has been detected from one of your team members. Your entire team has been temporarily suspended. Contact the competition administrator."
          )}
        </p>

        <div className="p-3 bg-cyber-bg/50 border border-cyber-border rounded text-xs text-cyber-muted font-mono">
          {isDisqualified ? (
            "All sessions revoked. Flag submissions locked. Active labs terminated."
          ) : (
            "One official warning reinstatement is available. The competition administrator must review and clear your team."
          )}
        </div>

        <div className="mt-6 flex justify-center gap-4">
          <a
            href="/login"
            className="px-5 py-2.5 rounded-lg border border-cyber-border bg-cyber-bg hover:border-cyber-neon text-cyber-text text-sm font-mono transition-colors"
          >
            Return to Arena Portal
          </a>
        </div>
      </div>
    </div>
  );
}
