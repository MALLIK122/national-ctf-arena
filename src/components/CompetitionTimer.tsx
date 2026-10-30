"use client";

import React, { useEffect, useState } from "react";
import { Clock, Play, Pause, AlertTriangle } from "lucide-react";

export default function CompetitionTimer() {
  const [status, setStatus] = useState<string>("WAITING");
  const [seconds, setSeconds] = useState<number>(10800); // 3 hours

  useEffect(() => {
    // Initial fetch
    fetch("/api/admin/timer")
      .then(res => res.json())
      .then(data => {
        if (data.status) setStatus(data.status);
        if (typeof data.remainingSeconds === "number") setSeconds(data.remainingSeconds);
      })
      .catch(() => {});

    // SSE Realtime Sync
    const es = new EventSource("/api/events");
    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === "TIMER_UPDATE") {
          setStatus(parsed.payload.status);
          if (typeof parsed.payload.remainingSeconds === "number") {
            setSeconds(parsed.payload.remainingSeconds);
          }
        }
      } catch (e) {}
    };

    // Client-side local countdown decrement
    const interval = setInterval(() => {
      setSeconds(prev => {
        if (status === "RUNNING" && prev > 0) {
          return prev - 1;
        }
        return prev;
      });
    }, 1000);

    return () => {
      es.close();
      clearInterval(interval);
    };
  }, [status]);

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg border border-cyber-border bg-cyber-card/90 backdrop-blur shadow-sm font-mono text-xs">
      <Clock className={`w-4 h-4 ${status === "RUNNING" ? "text-cyber-neon animate-pulse" : status === "PAUSED" ? "text-cyber-amber" : "text-cyber-muted"}`} />
      
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-cyber-muted font-sans flex items-center gap-1">
          {status === "RUNNING" && <span className="w-1.5 h-1.5 rounded-full bg-cyber-neon animate-ping" />}
          {status === "PAUSED" && <span className="w-1.5 h-1.5 rounded-full bg-cyber-amber" />}
          ARENA TIMER ({status})
        </span>
        <span className={`text-sm font-bold tracking-widest ${status === "RUNNING" ? "text-cyber-neon text-shadow-neon" : status === "PAUSED" ? "text-cyber-amber" : "text-cyber-text"}`}>
          {formattedTime}
        </span>
      </div>
    </div>
  );
}
