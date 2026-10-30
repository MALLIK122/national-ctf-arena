"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import { 
  ArrowLeft, Terminal as TerminalIcon, Flag, Key, Lock, 
  HelpCircle, AlertCircle, CheckCircle2, Play, Square, 
  Clock, ShieldAlert, ExternalLink, Sparkles 
} from "lucide-react";
import Terminal from "@/components/Terminal";
import ClientAntiCheatWatcher from "@/components/ClientAntiCheatWatcher";
import SuspensionModal from "@/components/SuspensionModal";

export default function ChallengeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id as string;

  const [session, setSession] = useState<any>(null);
  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Lab State
  const [activeLab, setActiveLab] = useState<any>(null);
  const [labStarting, setLabStarting] = useState(false);

  // Flag Submission State
  const [flagInput, setFlagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Disciplinary State
  const [disciplinaryStatus, setDisciplinaryStatus] = useState<string>("ACTIVE");
  const [suspensionReason, setSuspensionReason] = useState<string>("");

  const fetchData = async () => {
    try {
      const sessRes = await fetch("/api/auth/session");
      const sessData = await sessRes.json();
      if (!sessData.authenticated) {
        router.push("/login");
        return;
      }
      setSession(sessData);
      setDisciplinaryStatus(sessData.team?.disciplinaryStatus || "ACTIVE");
      setSuspensionReason(sessData.team?.suspensionReason || "");

      const chalRes = await fetch(`/api/challenges/${challengeId}`);
      if (!chalRes.ok) {
        router.push("/challenges");
        return;
      }
      const chalData = await chalRes.json();
      setChallenge(chalData.challenge);
      if (chalData.challenge.activeLab) {
        setActiveLab(chalData.challenge.activeLab);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [challengeId]);

  const handleLaunchLab = async () => {
    setLabStarting(true);
    try {
      const res = await fetch("/api/labs/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActiveLab(data.lab);
    } catch (err: any) {
      alert(`Lab launch failed: ${err.message}`);
    } finally {
      setLabStarting(false);
    }
  };

  const handleStopLab = async () => {
    try {
      await fetch("/api/labs/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId })
      });
      setActiveLab(null);
    } catch (e) {}
  };

  const handleUnlockHint = async (hintIndex: number, cost: number) => {
    const confirm = window.confirm(`Unlocking this hint will deduct ${cost} points from your challenge reward. Proceed?`);
    if (!confirm) return;

    try {
      const res = await fetch("/api/hints/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, hintIndex })
      });
      const data = await res.json();
      if (res.ok) {
        fetchData();
      }
    } catch (e) {}
  };

  const handleSubmitFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagInput.trim()) return;

    setSubmitting(true);
    setSubmissionFeedback(null);

    try {
      const res = await fetch("/api/flags/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, flag: flagInput })
      });

      const data = await res.json();
      if (res.ok && data.isCorrect) {
        setSubmissionFeedback({ success: true, message: data.message });
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
        fetchData();
      } else {
        setSubmissionFeedback({ success: false, message: data.error || data.message || "Incorrect flag." });
      }
    } catch (err: any) {
      setSubmissionFeedback({ success: false, message: "Network error submitting flag." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !challenge) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center font-mono text-xs text-cyber-neon">
        <span className="w-2.5 h-2.5 rounded-full bg-cyber-neon animate-ping mr-3" />
        INITIALIZING MISSION INTERFACE...
      </div>
    );
  }

  const isSolved = challenge.teamAssignment?.status === "SOLVED";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 font-mono">
      {/* Background Tab Surveillance Engine */}
      <ClientAntiCheatWatcher
        teamId={session?.team?.id}
        memberId={session?.member?.id}
        disciplinaryStatus={disciplinaryStatus}
        onStatusChange={(newStatus, reason) => {
          setDisciplinaryStatus(newStatus);
          setSuspensionReason(reason || "");
        }}
      />

      {/* Mandatory Suspension Modal */}
      <SuspensionModal
        status={disciplinaryStatus}
        reason={suspensionReason}
        teamId={session?.team?.id}
      />

      {/* Back link */}
      <Link
        href="/challenges"
        className="inline-flex items-center gap-1.5 text-xs text-cyber-muted hover:text-cyber-neon transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Challenge Directory</span>
      </Link>

      {/* Challenge Title Bar */}
      <div className="p-6 rounded-2xl border border-cyber-border bg-cyber-card mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-cyber-bg border border-cyber-border text-cyber-neon font-bold">
                {challenge.id}
              </span>
              <span className="text-cyber-muted">•</span>
              <span className="text-cyber-muted uppercase tracking-wider">{challenge.category.replace("_", " ")}</span>
              <span className="text-cyber-muted">•</span>
              <span className="text-cyber-amber font-bold">{challenge.difficulty}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-cyber-text tracking-wide">
              {challenge.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-5 py-3 rounded-xl bg-cyber-bg border border-cyber-border text-center">
              <span className="text-[10px] text-cyber-muted uppercase block">Value</span>
              <span className="text-xl font-black text-cyber-neon">{challenge.points} PTS</span>
            </div>

            {isSolved && (
              <div className="px-4 py-3 rounded-xl bg-cyber-neon/10 border border-cyber-neon/40 text-cyber-neon text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>SOLVED</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Briefing, Instructions, Hints (Col 1 & 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mission Scenario */}
          <div className="p-6 rounded-2xl border border-cyber-border bg-cyber-card space-y-4">
            <h2 className="text-sm font-bold text-cyber-neon uppercase tracking-wider flex items-center gap-2 border-b border-cyber-border pb-3">
              <Sparkles className="w-4 h-4" />
              <span>Operational Scenario</span>
            </h2>
            <p className="text-xs text-cyber-text/90 leading-relaxed font-sans font-medium">
              {challenge.scenario}
            </p>
          </div>

          {/* Technical Instructions */}
          <div className="p-6 rounded-2xl border border-cyber-border bg-cyber-card space-y-4">
            <h2 className="text-sm font-bold text-cyber-blue uppercase tracking-wider flex items-center gap-2 border-b border-cyber-border pb-3">
              <Key className="w-4 h-4" />
              <span>Engagement Protocol</span>
            </h2>
            <div className="text-xs text-cyber-muted whitespace-pre-wrap leading-relaxed font-mono">
              {challenge.instructions}
            </div>
          </div>

          {/* Interactive Live Lab Container Widget */}
          {challenge.hasLiveLab && (
            <div className="p-6 rounded-2xl border border-cyber-border bg-cyber-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyber-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue">
                    <TerminalIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-cyber-text uppercase">
                      Dedicated Target Environment
                    </h2>
                    <span className="text-[11px] text-cyber-muted">
                      Status: {activeLab ? <span className="text-cyber-neon font-bold">RUNNING</span> : "STOPPED"}
                    </span>
                  </div>
                </div>

                <div>
                  {activeLab ? (
                    <button
                      onClick={handleStopLab}
                      className="px-4 py-2 rounded-lg border border-cyber-red/50 bg-cyber-red/10 text-cyber-red hover:bg-cyber-red hover:text-cyber-bg transition-colors text-xs font-bold flex items-center gap-2"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>TERMINATE LAB</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleLaunchLab}
                      disabled={labStarting}
                      className="px-5 py-2 rounded-lg bg-cyber-blue text-cyber-bg hover:bg-cyber-blue/90 hover:shadow-blue transition-all text-xs font-bold flex items-center gap-2 disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{labStarting ? "INITIALIZING SANDBOX..." : "LAUNCH LAB ENVIRONMENT"}</span>
                    </button>
                  )}
                </div>
              </div>

              {activeLab ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-cyber-bg p-3.5 rounded-xl border border-cyber-border">
                    <div>
                      <span className="text-cyber-muted text-[10px] uppercase block">TARGET IP ADDRESS:</span>
                      <span className="font-bold text-cyber-neon text-sm">{activeLab.targetIp}</span>
                    </div>
                    <div>
                      <span className="text-cyber-muted text-[10px] uppercase block">EXPOSED PORT:</span>
                      <span className="font-bold text-cyber-blue text-sm">{activeLab.targetPort}</span>
                    </div>
                  </div>

                  {/* Embedded Browser Terminal */}
                  <Terminal
                    challengeId={challenge.id}
                    targetIp={activeLab.targetIp}
                    targetPort={activeLab.targetPort}
                  />
                </div>
              ) : (
                <div className="p-8 text-center bg-cyber-bg/50 border border-cyber-border/60 rounded-xl">
                  <TerminalIcon className="w-8 h-8 text-cyber-muted mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-cyber-muted">
                    Click "LAUNCH LAB ENVIRONMENT" above to deploy your team's isolated target container.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Flag Submission & Hints (Col 3) */}
        <div className="space-y-6">
          {/* Flag Submission Card */}
          <div className="p-6 rounded-2xl border border-cyber-border bg-cyber-card space-y-4">
            <h2 className="text-sm font-bold text-cyber-text uppercase tracking-wider flex items-center gap-2 border-b border-cyber-border pb-3">
              <Flag className="w-4 h-4 text-cyber-neon" />
              <span>Submit Proof of Compromise</span>
            </h2>

            {isSolved ? (
              <div className="p-4 bg-cyber-neon/10 border border-cyber-neon/30 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-cyber-neon mx-auto" />
                <span className="text-xs font-bold text-cyber-neon block">MISSION ACCOMPLISHED</span>
                <p className="text-[11px] text-cyber-muted">
                  Your team has successfully solved this challenge. Points are recorded.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitFlag} className="space-y-4">
                <div>
                  <label className="block text-[11px] text-cyber-muted uppercase mb-1.5">
                    Flag Token
                  </label>
                  <input
                    type="text"
                    required
                    value={flagInput}
                    onChange={(e) => setFlagInput(e.target.value)}
                    placeholder="CTF{...}"
                    className="w-full bg-cyber-bg border border-cyber-border focus:border-cyber-neon rounded-lg px-3.5 py-2.5 text-xs text-cyber-neon outline-none font-mono"
                  />
                  <span className="text-[10px] text-cyber-muted mt-1 block">
                    Case-sensitive. Server dynamically validates against your team HMAC.
                  </span>
                </div>

                {submissionFeedback && (
                  <div className={`p-3 rounded-lg text-xs font-mono flex items-start gap-2 ${
                    submissionFeedback.success
                      ? "bg-cyber-neon/10 border border-cyber-neon/40 text-cyber-neon"
                      : "bg-cyber-red/10 border border-cyber-red/40 text-cyber-red"
                  }`}>
                    {submissionFeedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                    <span>{submissionFeedback.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !flagInput.trim()}
                  className="w-full py-3 rounded-lg bg-cyber-neon text-cyber-bg font-bold text-xs uppercase tracking-wider hover:bg-cyber-neon/90 hover:shadow-neon transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Flag className="w-4 h-4" />
                  <span>{submitting ? "Evaluating Proof..." : "Submit Flag"}</span>
                </button>
              </form>
            )}
          </div>

          {/* Hints Section */}
          <div className="p-6 rounded-2xl border border-cyber-border bg-cyber-card space-y-4">
            <h2 className="text-sm font-bold text-cyber-text uppercase tracking-wider flex items-center gap-2 border-b border-cyber-border pb-3">
              <HelpCircle className="w-4 h-4 text-cyber-amber" />
              <span>Intelligence Hints</span>
            </h2>

            {challenge.hints && challenge.hints.length > 0 ? (
              <div className="space-y-3">
                {challenge.hints.map((hint: any) => (
                  <div
                    key={hint.index}
                    className="p-3.5 rounded-xl border border-cyber-border bg-cyber-bg text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-cyber-muted font-bold text-[11px]">
                        HINT #{hint.index + 1}
                      </span>
                      {hint.isUnlocked ? (
                        <span className="text-cyber-neon text-[10px] bg-cyber-neon/10 px-2 py-0.5 rounded border border-cyber-neon/30">
                          UNLOCKED
                        </span>
                      ) : (
                        <span className="text-cyber-amber text-[10px]">
                          -{hint.cost} PTS PENALTY
                        </span>
                      )}
                    </div>

                    {hint.isUnlocked ? (
                      <p className="text-cyber-text text-xs leading-relaxed font-sans font-medium">
                        {hint.text}
                      </p>
                    ) : (
                      <button
                        onClick={() => handleUnlockHint(hint.index, hint.cost)}
                        className="w-full py-2 rounded border border-cyber-border hover:border-cyber-amber text-cyber-muted hover:text-cyber-amber text-[11px] font-bold transition-colors"
                      >
                        UNLOCK HINT FOR {hint.cost} PTS
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-cyber-muted">No hints authored for this mission.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
