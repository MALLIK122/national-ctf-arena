"use client";

import React, { useState, useRef, useEffect } from "react";
import { Terminal as TerminalIcon, Play, RotateCcw, ShieldCheck } from "lucide-react";

interface TerminalProps {
  challengeId: string;
  targetIp: string;
  targetPort: number;
}

export default function Terminal({ challengeId, targetIp, targetPort }: TerminalProps) {
  const [history, setHistory] = useState<Array<{ cmd?: string; output: string }>>([
    {
      output: [
        "NATIONAL CTF CYBER ARENA - HIGH-TECH ISOLATED LAB SHELL",
        "Target Machine: " + targetIp + ":" + targetPort,
        "Runtime Mode: ISOLATED SANDBOX GATEWAY (Production Docker Architecture)",
        "Type 'help' for available tools or 'clear' to reset screen.\n"
      ].join("\r\n")
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length > 0 && historyIndex < cmdHistory.length - 1) {
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setInput(cmdHistory[cmdHistory.length - 1 - nextIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInput(cmdHistory[cmdHistory.length - 1 - nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    if (trimmed === "clear") {
      setHistory([]);
      setInput("");
      return;
    }

    setCmdHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/labs/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, command: trimmed })
      });

      const data = await res.json();
      if (res.ok) {
        setHistory(prev => [...prev, { cmd: trimmed, output: data.output }]);
      } else {
        setHistory(prev => [...prev, { cmd: trimmed, output: data.error || "Execution failed." }]);
      }
    } catch (err: any) {
      setHistory(prev => [...prev, { cmd: trimmed, output: "Network error communicating with lab gateway." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[520px] rounded-xl border border-cyber-border bg-cyber-bg overflow-hidden shadow-2xl font-mono text-xs">
      {/* Terminal Titlebar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-cyber-card border-b border-cyber-border select-none">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-cyber-red/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-cyber-amber/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-cyber-neon/80 inline-block" />
          </div>
          <span className="text-cyber-muted text-[11px] ml-2 flex items-center gap-1.5">
            <TerminalIcon className="w-3.5 h-3.5 text-cyber-neon" />
            operator@cyber-sandbox:~ [{targetIp}:{targetPort}]
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-cyber-neon bg-cyber-neon/10 px-2 py-0.5 rounded border border-cyber-neon/30 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            ISOLATED SESSION
          </span>
          <button
            onClick={() => setHistory([])}
            className="text-cyber-muted hover:text-cyber-text transition-colors p-1"
            title="Clear terminal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Screen */}
      <div 
        className="flex-1 p-4 overflow-y-auto space-y-2 select-text"
        onClick={() => inputRef.current?.focus()}
      >
        {history.map((entry, idx) => (
          <div key={idx} className="space-y-1">
            {entry.cmd && (
              <div className="flex items-center gap-2 text-cyber-neon">
                <span className="text-cyber-blue font-bold">operator@arena-lab:~$</span>
                <span className="text-cyber-text font-bold">{entry.cmd}</span>
              </div>
            )}
            <pre className="text-cyber-text/90 whitespace-pre-wrap leading-relaxed font-mono">
              {entry.output}
            </pre>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-cyber-muted animate-pulse">
            <span className="w-2 h-2 rounded-full bg-cyber-neon" />
            Executing in sandboxed container...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Terminal Input Line */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-cyber-card/80 border-t border-cyber-border">
        <span className="text-cyber-blue font-bold shrink-0">operator@arena-lab:~$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="Type command (e.g. nmap 10.10.14.22, nc -nv target 8088, curl, cat, help)..."
          className="flex-1 bg-transparent text-cyber-neon outline-none border-none focus:ring-0 placeholder:text-cyber-muted/50 font-mono text-xs"
          autoFocus
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !input.trim()}
          className="px-2.5 py-1 rounded bg-cyber-neon/10 border border-cyber-neon/30 text-cyber-neon hover:bg-cyber-neon hover:text-cyber-bg transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <Play className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
