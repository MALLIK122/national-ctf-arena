"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface WatcherProps {
  teamId?: string;
  memberId?: string;
  disciplinaryStatus?: string;
  onStatusChange?: (newStatus: string, reason?: string) => void;
}

export default function ClientAntiCheatWatcher({
  teamId,
  memberId,
  disciplinaryStatus,
  onStatusChange
}: WatcherProps) {
  const router = useRouter();
  const lastIncidentRef = useRef<number>(0);
  const blurTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only monitor if logged in as a participant and not already suspended/disqualified
    if (!teamId || !memberId) return;
    if (disciplinaryStatus === "DISQUALIFIED" || disciplinaryStatus === "WARNING_SUSPENDED") return;

    const reportViolation = async (eventType: string, details: string) => {
      const now = Date.now();
      // Grace period / deduplication: do not send another violation within 6 seconds
      if (now - lastIncidentRef.current < 6000) return;
      lastIncidentRef.current = now;

      try {
        const res = await fetch("/api/anti-cheat/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType,
            details,
            evidenceData: {
              url: window.location.href,
              screenWidth: window.innerWidth,
              screenHeight: window.innerHeight,
              timestamp: new Date().toISOString()
            }
          })
        });

        const data = await res.json();
        if (data.status && data.status !== disciplinaryStatus) {
          if (onStatusChange) {
            onStatusChange(data.status, details);
          }
        }
      } catch (e) {
        console.error("Failed to report violation:", e);
      }
    };

    // 1. Visibility Change Listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Participant navigated away from competition tab
        reportViolation(
          "TAB_VISIBILITY_LOST",
          "Competition tab visibility was lost. Switching away from the arena page is a policy violation."
        );
      }
    };

    // 2. Window Blur Listener with 2.5s grace window
    const handleWindowBlur = () => {
      blurTimerRef.current = setTimeout(() => {
        if (!document.hasFocus()) {
          reportViolation(
            "WINDOW_BLUR",
            "Arena window lost focus for more than 2.5 seconds."
          );
        }
      }, 2500);
    };

    const handleWindowFocus = () => {
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
        blurTimerRef.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    // Listen to real-time status updates via SSE
    const es = new EventSource("/api/events");
    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === "TEAM_STATUS_CHANGED" && parsed.payload.teamId === teamId) {
          if (onStatusChange) {
            onStatusChange(parsed.payload.status, parsed.payload.reason);
          }
        }
      } catch (e) {}
    };

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
      es.close();
    };
  }, [teamId, memberId, disciplinaryStatus, onStatusChange]);

  return null;
}
