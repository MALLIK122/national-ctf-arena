"use client";

import React, { useEffect, useState, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";

export function playCyberAlertSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Two-tone warning beep
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.setValueAtTime(440, ctx.currentTime + 0.15); // A4
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.30); // A5

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    // AudioContext might require user gesture on first load
  }
}

export default function AudioAlertToggle() {
  const [muted, setMuted] = useState(false);

  return (
    <button
      onClick={() => setMuted(!muted)}
      className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono border border-cyber-border bg-cyber-card hover:border-cyber-neon transition-colors"
      title={muted ? "Sound alerts muted" : "Sound alerts enabled"}
    >
      {muted ? (
        <>
          <VolumeX className="w-4 h-4 text-cyber-muted" />
          <span className="text-cyber-muted">ALERT AUDIO: OFF</span>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4 text-cyber-neon animate-pulse" />
          <span className="text-cyber-neon">ALERT AUDIO: ON</span>
        </>
      )}
    </button>
  );
}
