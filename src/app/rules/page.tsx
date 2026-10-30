import React from "react";
import Link from "next/link";
import { 
  BookOpen, ShieldAlert, CheckCircle2, XCircle, 
  Eye, AlertTriangle, Scale, Lock, ArrowRight 
} from "lucide-react";

export default function RulesPage() {
  const rules = [
    {
      num: "01",
      title: "Team Structure & Co-Operative Limits",
      desc: "Each registered team consists of exactly two registered operatives sharing a unified Team ID. Both members can log in concurrently from separate devices. Actions and submissions update team progress in real time."
    },
    {
      num: "02",
      title: "Strict Proscription Against Flag Sharing & Collusion",
      desc: "Flags are dynamically salted and assigned uniquely to each Team ID. Sharing flags, hints, solutions, or collaborative intelligence between competing teams is strictly forbidden and detected via automated pattern telemetry."
    },
    {
      num: "03",
      title: "Scope of Authorized Testing & Lab Targets",
      desc: "Penetration testing and exploitation activities are strictly restricted to isolated, team-assigned target instances (e.g. 10.10.X.Y subnets launched via the arena gateway). Probing the arena host server, other teams' labs, or public internet networks is strictly prohibited."
    },
    {
      num: "04",
      title: "Prohibition of Denial of Service (DoS/DDoS)",
      desc: "Resource exhaustion attacks, syn floods, container starvation, and deliberate degradation of the arena platform or lab routing fabric will result in immediate disqualification and forensic log preservation."
    },
    {
      num: "05",
      title: "Server-Authoritative Evaluation & Anti-Brute Force",
      desc: "Flag submission rate limiting is enforced (minimum 2.5 seconds between submissions). Automated flag-fuzzing or dictionary attacks against flag submission endpoints will trigger automated rate-limit lockouts."
    },
    {
      num: "06",
      title: "Hint Deductions & Scoring Dynamics",
      desc: "Hints carry non-refundable point penalties deducted from the challenge's gross award. Once unlocked by either team member, the hint is permanently available to both operatives."
    },
    {
      num: "07",
      title: "Event Timing & Server-Controlled Lifecycle",
      desc: "The competition duration is precisely 3 hours (10,800 seconds). Upon the timer reaching zero, all flag submissions and lab launches are instantly halted. Active containers are safely isolated and final scores are frozen."
    },
    {
      num: "08",
      title: "Finality of Administrator Rulings",
      desc: "The Competition Director and Chief Judges hold ultimate authority over rule interpretation, technical appeals, penalty enforcement, and final standings."
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-cyber-card border border-cyber-border text-cyber-neon shadow-sm">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black font-mono tracking-tight text-cyber-text uppercase">
            RULES & <span className="text-cyber-neon">CODE OF CONDUCT</span>
          </h1>
          <p className="text-xs font-mono text-cyber-muted">
            National CTF Cyber Arena • Regulatory Framework & Disciplinary Policies
          </p>
        </div>
      </div>

      {/* MANDATORY TEAM-WIDE ANTI-CHEATING WARNING BANNER */}
      <div className="border border-cyber-amber bg-cyber-amber/10 rounded-2xl p-6 sm:p-8 mb-12 shadow-lg shadow-amber-500/10">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-cyber-amber/20 border border-cyber-amber/40 text-cyber-amber shrink-0 mt-1">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black font-mono text-cyber-amber tracking-wide uppercase mb-2">
              CRITICAL NOTICE: TEAM-WIDE ANTI-CHEATING & TAB SURVEILLANCE
            </h2>
            <p className="text-xs font-mono text-cyber-text leading-relaxed mb-4">
              The competition platform enforces client-side document visibility and focus surveillance to maintain championship integrity. 
              Review the strict team-level enforcement model below:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 bg-cyber-bg/90 border border-cyber-border rounded-xl">
                <span className="text-cyber-amber font-bold block mb-1">FIRST VIOLATION: TEAM SUSPENSION</span>
                <p className="text-cyber-muted leading-relaxed">
                  If either member navigates away from the arena tab or exits fullscreen, the entire team is immediately placed into 
                  <span className="text-cyber-amber font-bold"> WARNING_SUSPENDED</span>. Both operatives' sessions are suspended and flag submissions are locked. Exactly ONE administrative reinstatement is possible.
                </p>
              </div>

              <div className="p-4 bg-cyber-bg/90 border border-cyber-border rounded-xl">
                <span className="text-cyber-red font-bold block mb-1">SECOND VIOLATION: DISQUALIFICATION</span>
                <p className="text-cyber-muted leading-relaxed">
                  If either operative commits a subsequent violation after reinstatement, the team status becomes 
                  <span className="text-cyber-red font-bold"> DISQUALIFIED</span>. Participation is permanently frozen, active labs are terminated, and sessions are permanently revoked.
                </p>
              </div>
            </div>

            <p className="text-[11px] font-mono text-cyber-muted mt-4">
              * Privacy Notice: The monitoring engine strictly inspects browser tab visibility state and window focus events. It does not monitor operating system applications, personal files, or external devices.
            </p>
          </div>
        </div>
      </div>

      {/* 8 Rules Grid */}
      <div className="space-y-4 mb-12">
        <h2 className="text-xl font-black font-mono text-cyber-text uppercase tracking-wider mb-6 flex items-center gap-2">
          <Scale className="w-5 h-5 text-cyber-blue" />
          <span>OFFICIAL COMPETITION REGULATIONS</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((r) => (
            <div key={r.num} className="p-5 rounded-xl border border-cyber-border bg-cyber-card/90 font-mono">
              <div className="flex items-center gap-2 text-cyber-neon font-bold text-xs mb-2">
                <span className="px-1.5 py-0.5 rounded bg-cyber-neon/10 border border-cyber-neon/30">{r.num}</span>
                <span className="text-cyber-text">{r.title}</span>
              </div>
              <p className="text-xs text-cyber-muted leading-relaxed">
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="p-6 rounded-2xl border border-cyber-border bg-cyber-card flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
        <div>
          <span className="text-cyber-text font-bold text-sm block">Ready to accept the challenge?</span>
          <span className="text-cyber-muted text-xs">Authenticate using your pre-assigned team credentials to begin.</span>
        </div>
        <Link
          href="/login"
          className="px-6 py-3 rounded-xl bg-cyber-neon text-cyber-bg font-bold tracking-wider hover:bg-cyber-neon/90 hover:shadow-neon transition-all flex items-center gap-2 shrink-0"
        >
          <span>ENTER ARENA</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
