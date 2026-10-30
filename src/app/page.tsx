import React from "react";
import Link from "next/link";
import { 
  Shield, Terminal, Flag, Trophy, Lock, Cpu, 
  ArrowRight, Users, Zap, CheckCircle2, AlertTriangle, Eye
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28 border-b border-cyber-border">
        {/* Glow gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyber-neon/10 blur-[130px] pointer-events-none rounded-full" />
        <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-cyber-blue/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative text-center">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyber-neon/30 bg-cyber-neon/10 text-cyber-neon text-xs font-mono mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyber-neon animate-ping" />
            <span>NATIONAL CYBER DEFENSE COMPETITION • 3-HOUR LIVE ARENA</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black font-mono tracking-tight text-cyber-text uppercase mb-6 leading-none">
            NATIONAL CTF <br />
            <span className="text-cyber-neon text-shadow-neon">CYBER ARENA</span>
          </h1>

          <p className="max-w-3xl mx-auto text-base sm:text-lg text-cyber-muted font-sans leading-relaxed mb-10">
            A production-grade, state-of-the-art cybersecurity proving ground. 
            Featuring 50 pre-provisioned teams, 100 concurrent cyber operators, 
            isolated browser-accessible Linux sandboxes, and server-verified dynamic flags.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-sm">
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-xl bg-cyber-neon text-cyber-bg font-bold tracking-wider hover:bg-cyber-neon/90 hover:shadow-neon transition-all flex items-center gap-2"
            >
              <span>ENTER ARENA</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/rules"
              className="px-6 py-3.5 rounded-xl border border-cyber-border bg-cyber-card text-cyber-text hover:border-cyber-blue hover:text-cyber-blue transition-all"
            >
              RULES & INTEGRITY POLICY
            </Link>

            <Link
              href="/leaderboard"
              className="px-6 py-3.5 rounded-xl border border-cyber-border bg-cyber-card text-cyber-text hover:border-cyber-neon hover:text-cyber-neon transition-all flex items-center gap-2"
            >
              <Trophy className="w-4 h-4 text-cyber-amber" />
              <span>LIVE LEADERBOARD</span>
            </Link>
          </div>

          {/* Key Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
            <div className="p-4 rounded-xl border border-cyber-border bg-cyber-card/70 backdrop-blur text-center font-mono">
              <span className="text-2xl sm:text-3xl font-black text-cyber-neon">50</span>
              <p className="text-xs text-cyber-muted uppercase mt-1">Pre-Created Teams</p>
            </div>
            <div className="p-4 rounded-xl border border-cyber-border bg-cyber-card/70 backdrop-blur text-center font-mono">
              <span className="text-2xl sm:text-3xl font-black text-cyber-blue">100</span>
              <p className="text-xs text-cyber-muted uppercase mt-1">Active Operatives</p>
            </div>
            <div className="p-4 rounded-xl border border-cyber-border bg-cyber-card/70 backdrop-blur text-center font-mono">
              <span className="text-2xl sm:text-3xl font-black text-cyber-amber">26</span>
              <p className="text-xs text-cyber-muted uppercase mt-1">National Challenges</p>
            </div>
            <div className="p-4 rounded-xl border border-cyber-border bg-cyber-card/70 backdrop-blur text-center font-mono">
              <span className="text-2xl sm:text-3xl font-black text-cyber-text">03:00:00</span>
              <p className="text-xs text-cyber-muted uppercase mt-1">Event Duration</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Specialized Categories Showcase */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 w-full">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-wider uppercase text-cyber-text mb-3">
            COMPETITION <span className="text-cyber-neon">DISCIPLINES</span>
          </h2>
          <p className="text-xs font-mono text-cyber-muted max-w-lg mx-auto">
            Challenging national scenarios spanning the full spectrum of cyber operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category 1 */}
          <div className="p-6 rounded-xl border border-cyber-border bg-cyber-card/80 hover:border-cyber-blue/60 transition-all group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue">
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-mono font-bold text-lg text-cyber-text group-hover:text-cyber-blue transition-colors">
                  Network Penetration Testing
                </h3>
                <span className="text-xs font-mono text-cyber-muted">7 Realistic Challenges</span>
              </div>
            </div>
            <p className="text-xs font-mono text-cyber-muted leading-relaxed">
              Industrial Modbus PLCs, covert DNS exfiltration PCAPs, BGP prefix hijacking, VLAN hopping, and multi-tier DMZ pivoting under strict ingress firewalls.
            </p>
          </div>

          {/* Category 2 */}
          <div className="p-6 rounded-xl border border-cyber-border bg-cyber-card/80 hover:border-cyber-red/60 transition-all group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-cyber-red/10 border border-cyber-red/30 text-cyber-red">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-mono font-bold text-lg text-cyber-text group-hover:text-cyber-red transition-colors">
                  Exploitation
                </h3>
                <span className="text-xs font-mono text-cyber-muted">7 Controlled Lab Targets</span>
              </div>
            </div>
            <p className="text-xs font-mono text-cyber-muted leading-relaxed">
              Second-order SQL injection, JWT key confusion forgery, Linux kernel SUID path hijacking, prototype pollution to RCE, and heap use-after-free binary exploitation.
            </p>
          </div>

          {/* Category 3 */}
          <div className="p-6 rounded-xl border border-cyber-border bg-cyber-card/80 hover:border-cyber-neon/60 transition-all group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-cyber-neon/10 border border-cyber-neon/30 text-cyber-neon">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-mono font-bold text-lg text-cyber-text group-hover:text-cyber-neon transition-colors">
                  Cryptography
                </h3>
                <span className="text-xs font-mono text-cyber-muted">6 Advanced Crypto Puzzles</span>
              </div>
            </div>
            <p className="text-xs font-mono text-cyber-muted leading-relaxed">
              Wiener's small private exponent RSA attack, differential fault analysis on AES key schedules, invalid curve ECDH point manipulation, and post-quantum LWE lattice reduction.
            </p>
          </div>

          {/* Category 4 */}
          <div className="p-6 rounded-xl border border-cyber-border bg-cyber-card/80 hover:border-cyber-amber/60 transition-all group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-cyber-amber/10 border border-cyber-amber/30 text-cyber-amber">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-mono font-bold text-lg text-cyber-text group-hover:text-cyber-amber transition-colors">
                  Digital Forensics
                </h3>
                <span className="text-xs font-mono text-cyber-muted">6 Forensic Investigations</span>
              </div>
            </div>
            <p className="text-xs font-mono text-cyber-muted leading-relaxed">
              Volatility 3 process injection & hollowing, image polyglot carving, deleted SQLite freelist record reconstruction, SPI flash firmware reverse engineering, and DRAM cold boot descrambling.
            </p>
          </div>
        </div>
      </section>

      {/* Strict Anti-Cheat & Lab Architecture Highlight */}
      <section className="py-16 border-t border-cyber-border bg-cyber-card/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono text-cyber-amber bg-cyber-amber/10 border border-cyber-amber/30 px-3 py-1 rounded-full mb-4">
                <Eye className="w-3.5 h-3.5" />
                <span>INTEGRITY ASSURANCE ENGINE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-mono text-cyber-text mb-4">
                TEAM-LEVEL AUTOMATIC SUSPENSION SYSTEM
              </h2>
              <p className="text-xs font-mono text-cyber-muted leading-relaxed mb-4">
                The competition employs client surveillance and server-authoritative enforcement. 
                Any confirmed tab-switching violation by either member suspends the entire team. 
                One administrative warning reinstatement opportunity is granted; a second violation results in permanent team disqualification.
              </p>
              <ul className="space-y-2 text-xs font-mono text-cyber-text">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyber-neon" />
                  <span>Real-time document visibility & focus monitoring</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyber-neon" />
                  <span>Atomic server-side session revocation & flag locks</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyber-neon" />
                  <span>Dynamic per-team flags prevent flag-sharing</span>
                </li>
              </ul>
            </div>

            <div className="border border-cyber-border bg-cyber-bg rounded-xl p-6 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-cyber-border mb-4">
                <span className="text-cyber-muted text-[11px]">DEMONSTRATION CREDENTIALS</span>
                <span className="text-cyber-neon text-[10px] bg-cyber-neon/10 px-2 py-0.5 rounded border border-cyber-neon/30">
                  READY FOR LOGIN
                </span>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-cyber-card border border-cyber-border rounded">
                  <span className="text-cyber-blue font-bold">Sample Team ID:</span> CTF-TEAM-001
                  <br />
                  <span className="text-cyber-blue font-bold">Team Password:</span> Arena2026#ctf-team-001
                  <br />
                  <span className="text-cyber-blue font-bold">Member 1 Code:</span> ACC-001-A
                  <br />
                  <span className="text-cyber-blue font-bold">Member 2 Code:</span> ACC-001-B
                </div>
                <div className="p-3 bg-cyber-card border border-cyber-border rounded">
                  <span className="text-cyber-amber font-bold">Administrator Login:</span> admin
                  <br />
                  <span className="text-cyber-amber font-bold">Admin Password:</span> Admin2026!NationalArena
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
