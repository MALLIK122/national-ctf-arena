"use client";

import React, { useState } from "react";
import { ShieldCheck, Eye, Users, AlertTriangle } from "lucide-react";

interface PolicyModalProps {
  isOpen: boolean;
  onAccepted: () => void;
}

export default function PolicyAcknowledgementModal({ isOpen, onAccepted }: PolicyModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!agreed) return;
    setSubmitting(true);
    try {
      await fetch("/api/anti-cheat/policy-ack", { method: "POST" });
      onAccepted();
    } catch (e) {
      onAccepted();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="max-w-2xl w-full border border-cyber-borderLight bg-cyber-card rounded-xl p-8 relative shadow-2xl">
        <div className="flex items-center gap-3 mb-6 border-b border-cyber-border pb-4">
          <div className="p-2.5 rounded-lg bg-cyber-neon/10 border border-cyber-neon/30 text-cyber-neon">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black font-mono text-cyber-neon tracking-wide">
              MANDATORY COMPETITION INTEGRITY POLICY
            </h2>
            <p className="text-xs text-cyber-muted font-mono">
              National CTF Cyber Arena • Team Disciplinary Regulation
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs font-mono text-cyber-text/90 mb-6 max-h-80 overflow-y-auto pr-2">
          <div className="p-3 bg-cyber-bg border border-cyber-border rounded-lg flex items-start gap-3">
            <Eye className="w-5 h-5 text-cyber-blue shrink-0 mt-0.5" />
            <div>
              <strong className="text-cyber-blue">Active Browser Visibility Monitoring:</strong>
              <p className="text-cyber-muted mt-1">
                The competition platform actively monitors document visibility state, tab focus, and fullscreen events. Switching tabs or navigating away from the competition arena triggers an automated policy violation.
              </p>
            </div>
          </div>

          <div className="p-3 bg-cyber-bg border border-cyber-border rounded-lg flex items-start gap-3">
            <Users className="w-5 h-5 text-cyber-neon shrink-0 mt-0.5" />
            <div>
              <strong className="text-cyber-neon">Shared Team Disciplinary Responsibility:</strong>
              <p className="text-cyber-muted mt-1">
                Both team members operate under a shared Team ID. A violation triggered by EITHER member immediately suspends or disqualifies the ENTIRE team.
              </p>
            </div>
          </div>

          <div className="p-3 bg-cyber-bg border border-cyber-amber/40 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-cyber-amber shrink-0 mt-0.5" />
            <div>
              <strong className="text-cyber-amber">Single Reinstatement Opportunity:</strong>
              <p className="text-cyber-muted mt-1">
                Your team receives exactly ONE warning reinstatement. If suspended on a first violation, an administrator may review and reinstate your team. A second confirmed violation results in immediate, irreversible disqualification.
              </p>
            </div>
          </div>
        </div>

        <label className="flex items-start gap-3 p-3 bg-cyber-surface/60 border border-cyber-border rounded-lg cursor-pointer mb-6 group hover:border-cyber-neon/50 transition-colors">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 rounded border-cyber-border text-cyber-neon focus:ring-cyber-neon"
          />
          <span className="text-xs font-mono text-cyber-text leading-relaxed">
            I and my teammate have read and unconditionally accept the National CTF Cyber Arena Anti-Cheating & Disciplinary Policy. We understand that leaving the competition tab will trigger a team-wide suspension.
          </span>
        </label>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleConfirm}
            disabled={!agreed || submitting}
            className={`px-6 py-2.5 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all ${
              agreed
                ? "bg-cyber-neon text-cyber-bg hover:shadow-neon hover:bg-cyber-neon/90"
                : "bg-cyber-border text-cyber-muted cursor-not-allowed"
            }`}
          >
            {submitting ? "Confirming..." : "Acknowledge & Enter Arena"}
          </button>
        </div>
      </div>
    </div>
  );
}
