# NATIONAL CTF CYBER ARENA
## Advanced Team-Based Cybersecurity Competition Platform

A production-grade, national-level Capture The Flag (CTF) championship platform inspired by TryHackMe, Hack The Box, and international cybersecurity wargames.

Designed for high-concurrency national competitions supporting **50 pre-created teams**, **100 concurrent participants**, isolated browser-accessible cybersecurity labs, dynamically salted flags, server-authoritative live leaderboards, and an automated **Team-Wide Anti-Cheating & Suspension Engine**.

---

## 🛡️ KEY SYSTEM ARCHITECTURE & FEATURES

### 1. Design & Cyber Aesthetic
- **Cyberpunk Dark Palette**: Background near-black (`#080B10`), Accent Neon Green (`#00FF9D`), Electric Blue (`#00E5FF`), Amber warning (`#FFB800`), Critical Red (`#FF3366`).
- **Typography & UI**: High-density monospaced technical typography, terminal scanline indicators, reactive real-time status pills.
- **Responsive Layout**: Engineered for desktop command consoles, laptops, and tablets.

### 2. Authentication & 50 Pre-Created Teams
- **50 Teams Provisioned**: `CTF-TEAM-001` through `CTF-TEAM-050`.
- **2 Participant Slots Per Team**: Member 1 (Operative Alpha) and Member 2 (Operative Bravo).
- **Simultaneous Login**: Both members log in concurrently under the shared Team ID using unique Member Access Codes (`ACC-XXX-A` / `ACC-XXX-B`) and the shared team password.
- **Admin Downloadable CSV**: Full credential roster downloadable directly via `/api/auth/export-credentials` or the Admin Portal.
- **Cryptographic Security**: PBKDF2/SHA-256 salted password hashing, HTTP-only secure cookies, login brute-force rate-limiting, and account lockout after repeated failures.

### 3. Critical Feature: Team-Wide Anti-Cheating & Automatic Suspension
- **Active Surveillance**: Monitors `document.visibilitychange`, window blur/focus loss, and fullscreen exits.
- **Incident Deduplication**: Grace window debounces rapid focus events so a single incident generates at most one disciplinary action.
- **Team-Level Enforcement**: If *either* member triggers a qualifying violation:
  1. Entire team immediately placed into `WARNING_SUSPENDED`.
  2. Both members' sessions suspended.
  3. Flag submissions and lab launches blocked.
  4. Active labs paused.
  5. Inescapable warning screen displayed to both members.
  6. Immediate critical alert with audio chime broadcast to Admin Dashboard.
- **Single Warning Reinstatement**:
  - Admin button: `REINSTATE TEAM - FIRST WARNING`.
  - Reinstates login access, sets status to `WARNING_ISSUED`, and consumes the single warning.
- **Second Violation = Permanent Lock**:
  - Subsequent violation sets status to `DISQUALIFIED`.
  - Both members permanently blocked, active labs terminated, evidence archived.
- **Atomic Enforcement**: SQLite immediate transactions prevent race conditions during concurrent participant requests.

### 4. 26 National-Level Challenges Across 4 Disciplines
- **Category 1: Network Penetration Testing (7 Challenges)**
  - Reconnaissance, SCADA beacon enumeration, DNS tunnel exfiltration PCAPs, Modbus/TCP PLC coil register overrides, BGP route poisoning, Kerberos golden ticket analysis, VLAN 802.1Q trunk hopping.
- **Category 2: Exploitation (7 Challenges)**
  - Second-order SQL injection, JWT key confusion (alg: none / RS256 confusion), Linux kernel SUID relative PATH hijacking, filter evasion command injection, prototype pollution to RCE, heap use-after-free (UAF), SSRF cloud metadata extraction.
- **Category 3: Cryptography (6 Challenges)**
  - Polybius Hill matrix inversion, Wiener's small private exponent RSA, differential fault analysis on AES key schedules, invalid curve ECDH point manipulation, post-quantum Learning With Errors (LWE) lattice reduction, MD5 chosen-prefix collision forgery.
- **Category 4: Digital Forensics (6 Challenges)**
  - LSB image polyglots with GPS metadata, Volatility 3 process hollowing injection, Windows prefetch & registry timeline forensics, deleted SQLite freelist B-Tree carving, SPI flash firmware reverse engineering, DRAM cold-boot LFSR descrambling.
- **Dynamic Team-Specific Flags**: Flags are dynamically computed per team using HMAC-SHA256 (`CTF{..._<hmac>}`). A flag captured by Team 1 will NOT validate for Team 2, completely preventing collusion and flag-sharing!

### 5. TryHackMe-Inspired Live Lab Environment
- **Browser-Based Interactive Shell**: Complete xterm-style interactive terminal with real tools (`nmap`, `nc`, `curl`, `sqlmap`, `vol`, `binwalk`, `exiftool`, `cat`, `strings`, `sysmon` PATH privilege elevation).
- **Network Isolation**: Dedicated target IP space (`10.10.X.Y`) per team.
- **Dual Runtime Driver**: Production Docker container driver for Linux hosts with automatic fallback to the isolated sandboxed execution gateway on development machines without Docker daemons.

### 6. Real-Time Leaderboard & 3-Hour Global Timer
- **Server-Authoritative 3-Hour Countdown**: Synced via Server-Sent Events (SSE).
- **Tie-Breaking Algorithm**:
  1. Total Points (descending)
  2. Time of reaching final score (ascending, earlier is better)
  3. Number of completed challenges (descending)
- **Freeze Capability**: Admin can freeze the leaderboard before event conclusion.
- **Automatic Event Termination**: When timer reaches zero, flag submissions are disabled and active labs are terminated.

---

## 🚀 GETTING STARTED

### Prerequisites
- Node.js LTS (v20+ or v22.5+ or v26+)
- npm v10+

### Installation & Setup

1. **Install Dependencies**:
```bash
npm install
```

2. **Verify Database Initialization & Seed**:
The database is auto-provisioned upon first launch with all 50 teams, 100 members, 26 challenges, and competition settings in `data/national_ctf.db` via the built-in SQLite engine with WAL mode.

3. **Run the Automated Acceptance & Security Test Suite**:
```bash
npx tsx tests/platform-verification.ts
```
Expected output: **18 PASSED | 0 FAILED** (verifying teams, hashes, dynamic flags, lab tools, and all tests A through J).

4. **Launch Development Server**:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Production Build & Launch**:
```bash
npm run build
npm start
```

---

## 🔑 DEFAULT ACCESS CREDENTIALS

### Administrator Portal
- **URL**: `http://localhost:3000/login` (select **ADMINISTRATOR** tab)
- **Username**: `admin`
- **Password**: `Admin2026!NationalArena`

### Sample Participant Teams (Pre-Seeded 1 through 50)

| Team ID | Team Name | Team Password | Member 1 Code | Member 2 Code |
| :--- | :--- | :--- | :--- | :--- |
| `CTF-TEAM-001` | CyberVanguard | `Arena2026#ctf-team-001` | `ACC-001-A` | `ACC-001-B` |
| `CTF-TEAM-002` | ZeroDay Syndicate | `Arena2026#ctf-team-002` | `ACC-002-A` | `ACC-002-B` |
| `CTF-TEAM-003` | Ironclad Sentinel | `Arena2026#ctf-team-003` | `ACC-003-A` | `ACC-003-B` |
| `CTF-TEAM-050` | National Apex Team | `Arena2026#ctf-team-050` | `ACC-050-A` | `ACC-050-B` |

> *Quick-test presets are built directly into the login page for rapid one-click testing.*

---

## 📋 VERIFIED ACCEPTANCE CRITERIA MATRIX

| Criteria | Implementation Status | Verification Details |
| :--- | :---: | :--- |
| **50 Pre-Created Teams** | **PASS** | Auto-seeded `CTF-TEAM-001` to `CTF-TEAM-050` |
| **100 Participant Accounts** | **PASS** | 2 unique member slots per team with access codes |
| **Simultaneous Logins** | **PASS** | Concurrent session tokens under unified Team ID |
| **Cross-Team Isolation** | **PASS** | Server-side authorization blocks foreign team access |
| **Dynamic Team Flags** | **PASS** | Team HMAC-salted flags prevent flag sharing |
| **No Duplicate Points** | **PASS** | Atomic assignment locks prevent re-scoring |
| **Live Labs & Terminal** | **PASS** | Interactive shell with `nmap`, `nc`, `curl`, `sqlmap`, `vol` |
| **Real-Time Leaderboard** | **PASS** | SSE live push with 3-tier tie-breaking algorithm |
| **3-Hour Event Timer** | **PASS** | Server-controlled: Start, Pause, Resume, Auto-lock |
| **Test A: 1st Violation Suspension** | **PASS** | Tab loss triggers team-wide `WARNING_SUSPENDED` |
| **Test B: Protected API Block** | **PASS** | Suspended team flag submissions & labs rejected |
| **Test C: Login Blocked on Suspension** | **PASS** | Server-side auth blocks suspended team members |
| **Test D: Admin Reinstatement** | **PASS** | Warning consumed, status becomes `WARNING_ISSUED` |
| **Test E: 2nd Violation Disqualification** | **PASS** | 2nd violation triggers permanent `DISQUALIFIED` |
| **Test F & I: Deduplication** | **PASS** | Grace period prevents duplicate violation triggers |
| **Test J: Admin Reversal Audit** | **PASS** | All administrative actions logged in audit table |
| **Credentials CSV Export** | **PASS** | Admin-exclusive CSV download of all 50 credentials |

---

## 🌐 DOCKER PRODUCTION DEPLOYMENT

For deploying on a Linux host with isolated Docker containers:

```yaml
# docker-compose.yml
version: "3.8"
services:
  ctf-arena:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - arena-data:/app/data
    environment:
      - NODE_ENV=production
      - DOCKER_SOCKET=/var/run/docker.sock
    restart: always

volumes:
  arena-data:
```

---

## ⚖️ LICENSE & COMPLIANCE
Developed for national cybersecurity wargaming exercises, training simulations, and competitive championships. Intentionally vulnerable labs must only be hosted within segregated, private CTF environments.
