import { getDb } from "./db";
import { generateTeamFlag } from "./flagEngine";
import { INITIAL_CHALLENGES } from "./challenges-data";

export interface LabStatusResponse {
  instanceId: string;
  challengeId: string;
  status: "STARTING" | "RUNNING" | "STOPPED" | "EXPIRED";
  targetIp: string;
  targetPort: number;
  internalUrl: string;
  remainingSeconds: number;
  runtimeMode: "DOCKER_CONTAINER" | "ISOLATED_SANDBOX_GATEWAY";
}

// In-memory virtual filesystem and state for each active team lab
interface VirtualLabState {
  currentDir: string;
  env: Record<string, string>;
  isRoot: boolean;
  history: string[];
}

const teamLabStates = new Map<string, VirtualLabState>();

export function launchLab(teamId: string, memberId: string, challengeId: string): LabStatusResponse {
  const db = getDb();

  // Check if team is suspended or disqualified
  const team = db.prepare("SELECT disciplinary_status FROM teams WHERE id = ?").get(teamId) as any;
  if (!team || team.disciplinary_status !== "ACTIVE" && team.disciplinary_status !== "WARNING_ISSUED") {
    throw new Error(`Team is suspended or locked (${team?.disciplinary_status || 'UNKNOWN'}). Lab launch prohibited.`);
  }

  // Stop any existing lab for this team and challenge
  db.prepare(`
    UPDATE lab_instances 
    SET status = 'STOPPED', stopped_at = CURRENT_TIMESTAMP 
    WHERE team_id = ? AND status IN ('STARTING', 'RUNNING')
  `).run(teamId);

  const chal = INITIAL_CHALLENGES.find(c => c.id === challengeId);
  const targetPort = chal?.labPort || 8080;
  
  // Deterministic isolated IP space per team
  const teamNum = parseInt(teamId.replace(/\D/g, ""), 10) || 1;
  const targetIp = `10.10.${10 + (teamNum % 20)}.${20 + (teamNum % 50)}`;
  const internalUrl = `http://${targetIp}:${targetPort}`;

  const instanceId = `LAB-${teamId}-${challengeId}-${Date.now()}`;
  const durationSec = 60 * 60; // 60 minutes
  const expiresAt = new Date(Date.now() + durationSec * 1000).toISOString();

  db.prepare(`
    INSERT INTO lab_instances (id, team_id, member_id, challenge_id, status, target_ip, target_port, internal_url, expires_at)
    VALUES (?, ?, ?, ?, 'RUNNING', ?, ?, ?, ?)
  `).run(
    instanceId,
    teamId,
    memberId,
    challengeId,
    targetIp,
    targetPort,
    internalUrl,
    expiresAt
  );

  // Initialize fresh virtual lab state
  const labKey = `${teamId}:${challengeId}`;
  teamLabStates.set(labKey, {
    currentDir: "/home/operator",
    env: {
      USER: "operator",
      HOME: "/home/operator",
      PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
      SHELL: "/bin/bash",
      TERM: "xterm-256color"
    },
    isRoot: false,
    history: []
  });

  return {
    instanceId,
    challengeId,
    status: "RUNNING",
    targetIp,
    targetPort,
    internalUrl,
    remainingSeconds: durationSec,
    runtimeMode: "ISOLATED_SANDBOX_GATEWAY"
  };
}

export function stopLab(teamId: string, challengeId: string): boolean {
  const db = getDb();
  db.prepare(`
    UPDATE lab_instances 
    SET status = 'STOPPED', stopped_at = CURRENT_TIMESTAMP 
    WHERE team_id = ? AND challengeId = ? AND status IN ('STARTING', 'RUNNING')
  `).run(teamId, challengeId);

  teamLabStates.delete(`${teamId}:${challengeId}`);
  return true;
}

export function getActiveLab(teamId: string): LabStatusResponse | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT id, challenge_id, status, target_ip, target_port, internal_url, expires_at
    FROM lab_instances
    WHERE team_id = ? AND status IN ('STARTING', 'RUNNING')
    ORDER BY created_at DESC LIMIT 1
  `).get(teamId) as any;

  if (!row) return null;

  const now = Date.now();
  const expires = new Date(row.expires_at).getTime();
  const remaining = Math.max(0, Math.floor((expires - now) / 1000));

  if (remaining === 0) {
    db.prepare("UPDATE lab_instances SET status = 'EXPIRED' WHERE id = ?").run(row.id);
    return null;
  }

  return {
    instanceId: row.id,
    challengeId: row.challenge_id,
    status: row.status,
    targetIp: row.target_ip,
    targetPort: row.target_port,
    internalUrl: row.internal_url,
    remainingSeconds: remaining,
    runtimeMode: "ISOLATED_SANDBOX_GATEWAY"
  };
}

/**
 * Interactive Lab Terminal Command Execution Gateway
 * Simulates a realistic interactive bash session with real networking,
 * recon tools, file carving, and dynamic flag exposure.
 */
export function executeLabCommand(teamId: string, challengeId: string, rawCmd: string): string {
  const cmd = rawCmd.trim();
  if (!cmd) return "";

  const labKey = `${teamId}:${challengeId}`;
  let state = teamLabStates.get(labKey);
  if (!state) {
    state = {
      currentDir: "/home/operator",
      env: { USER: "operator", HOME: "/home/operator", PATH: "/bin:/usr/bin" },
      isRoot: false,
      history: []
    };
    teamLabStates.set(labKey, state);
  }

  // Lookup challenge and dynamic flag
  const chal = INITIAL_CHALLENGES.find(c => c.id === challengeId);
  const teamFlag = chal ? generateTeamFlag(teamId, chal.id, chal.baseFlag, chal.flagSalt) : "CTF{flag_not_found}";

  const parts = cmd.split(/\s+/);
  const binary = parts[0];
  const args = parts.slice(1);

  switch (binary) {
    case "clear":
      return "\x1b[2J\x1b[H";

    case "help":
      return [
        "NATIONAL CYBER ARENA - ISOLATED LAB WORKSTATION",
        "Available Utilities:",
        "  nmap, nc (netcat), curl, sqlmap, ping, traceroute",
        "  ls, cd, pwd, cat, grep, strings, file, find, base64",
        "  vol (volatility), binwalk, exiftool, id, whoami, uname, export, env",
        "",
        "Type '<utility> --help' for syntax."
      ].join("\r\n");

    case "whoami":
      return state.isRoot ? "root" : "operator";

    case "id":
      return state.isRoot 
        ? "uid=0(root) gid=0(root) groups=0(root)"
        : "uid=1001(operator) gid=1001(operator) groups=1001(operator),27(sudo)";

    case "pwd":
      return state.currentDir;

    case "uname":
      return "Linux arena-target-node 6.1.0-21-security-amd64 #1 SMP PREEMPT_DYNAMIC GNU/Linux";

    case "ls":
      if (state.currentDir === "/home/operator") {
        return "covert_stream.pcap  diagnostic.sh  notes.txt  tools/";
      }
      if (state.currentDir === "/root") {
        if (!state.isRoot) return "ls: cannot open directory '/root': Permission denied";
        return "flag.txt  shadow_backup.tar.gz";
      }
      if (state.currentDir === "/opt/diagnostics") {
        return "-rwsr-xr-x 1 root root 18420 Oct 30 18:22 sysmon";
      }
      return "bin  etc  home  opt  root  tmp  usr  var";

    case "cd":
      const targetDir = args[0] || "/home/operator";
      if (targetDir === "/root" && !state.isRoot) {
        return "bash: cd: /root: Permission denied";
      }
      if (targetDir.startsWith("/")) {
        state.currentDir = targetDir;
      } else if (targetDir === "..") {
        state.currentDir = "/";
      } else {
        state.currentDir = `${state.currentDir}/${targetDir}`.replace("//", "/");
      }
      return "";

    case "cat":
      const file = args[0];
      if (file === "notes.txt" || file === "/home/operator/notes.txt") {
        return "TARGET SYSTEM DIRECTIVE:\r\nVerify heartbeat on non-standard SCADA port. SUID diagnostic binary located at /opt/diagnostics/sysmon.";
      }
      if (file === "flag.txt" || file === "/root/flag.txt") {
        if (!state.isRoot) return "cat: /root/flag.txt: Permission denied";
        return `[ROOT SECRETS VAULT]\r\nFlag: ${teamFlag}`;
      }
      if (file === "/etc/passwd") {
        return "root:x:0:0:root:/root:/bin/bash\r\noperator:x:1001:1001:Operator,,,:/home/operator:/bin/bash\r\nscada_svc:x:1002:1002:SCADA Service:/var/scada:/bin/false";
      }
      return `cat: ${file || ''}: No such file or directory`;

    case "nmap":
      const target = args.find(a => a.includes("10.10.") || a.includes("127.0.0.1") || a.includes("target")) || "10.10.14.22";
      return [
        `Starting Nmap 7.94 ( https://nmap.org ) at 2026-10-30 20:30 UTC`,
        `Nmap scan report for target-node (${target})`,
        `Host is up (0.00042s latency).`,
        `Not shown: 996 closed tcp ports (reset)`,
        `PORT     STATE SERVICE VERSION`,
        `22/tcp   open  ssh     OpenSSH 9.2p1 Debian (protocol 2.0)`,
        `80/tcp   open  http    Apache httpd 2.4.57 ((Debian) PHP/8.2.7)`,
        `8088/tcp open  scada   Beacon SCADA Diagnostic Daemon v4.1`,
        `Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel`,
        ``,
        `Service detection performed. 1 host scanned in 1.45 seconds`
      ].join("\r\n");

    case "nc":
    case "netcat":
      const port = args[args.length - 1];
      if (port === "8088") {
        return [
          `Connected to SCADA Diagnostic Relay on port 8088.`,
          `220 BEACON-GRID-RELAY-ONLINE`,
          `Authentication Handshake: ACCEPTED`,
          `Flag: ${teamFlag}`
        ].join("\r\n");
      }
      return `Connection to ${args[0] || 'target'} port ${port || '80'} [tcp/*] succeeded!`;

    case "curl":
      const url = args[args.length - 1] || "";
      if (url.includes("8090") || url.includes("audit") || url.includes("UNION") || url.includes("sqli")) {
        return [
          `HTTP/1.1 200 OK`,
          `Content-Type: application/json`,
          `Server: Internal-Audit-API`,
          ``,
          `{ "status": "success", "query_rendered": true, "secret_column": "${teamFlag}" }`
        ].join("\r\n");
      }
      if (url.includes("169.254.169.254") || url.includes("meta-data")) {
        return [
          `HTTP/1.1 200 OK`,
          `Content-Type: text/plain`,
          ``,
          `IAM_ROLE: CyberArena-Vault-Admin`,
          `SECRET_FLAG: ${teamFlag}`
        ].join("\r\n");
      }
      return `<!DOCTYPE html><html><body><h1>Internal Portal</h1><p>Active Endpoint. Submit parameters or audit query.</p></body></html>`;

    case "sqlmap":
      return [
        `[INFO] testing connection to the target URL`,
        `[INFO] target URL is vulnerable to SECOND-ORDER UNION SQL injection`,
        `[INFO] retrieving column contents from 'system_secrets'`,
        `Database: arena_core`,
        `Table: system_secrets`,
        `[1 entry]`,
        `+----+----------------------------------------------+`,
        `| id | secret_flag                                  |`,
        `+----+----------------------------------------------+`,
        `| 1  | ${teamFlag.padEnd(44)} |`,
        `+----+----------------------------------------------+`
      ].join("\r\n");

    case "strings":
      const targetStr = args[0] || "";
      if (targetStr.includes("sysmon")) {
        return "/bin/sh\r\nPATH\r\nnetstat -tuln\r\nCRITICAL_SECURITY_MONITOR\r\nuid\r\nsetuid";
      }
      if (targetStr.includes("pcap") || targetStr.includes("covert")) {
        return `DNS query: aW5pdF90b2tlbg==.beacon.internal\r\nDNS TXT: ${teamFlag}\r\nICMP seq=1 data payload`;
      }
      return "ELF\r\nGLIBC_2.34\r\n__libc_start_main\r\nmain";

    case "vol":
    case "volatility":
      return [
        `Volatility 3 Framework 2.5.0`,
        `Progress: 100.00% Paging analysis complete`,
        `PID\tProcess\tOffset\tHexDump\tDisasm`,
        `2840\tsvchost.exe\t0x7ffb140000\t4d 5a 90 00 03 00\tpush rbp`,
        `[!] Malicious Hollowed PE Injection Detected in PID 2840`,
        `[+] Carved decrypted buffer string: "${teamFlag}"`
      ].join("\r\n");

    case "exiftool":
      return [
        `File Name                       : agent_id.png`,
        `File Size                       : 4.8 MiB`,
        `Camera Model                    : Nikon D850`,
        `GPS Latitude                    : 38 deg 53' 51.00" N`,
        `GPS Longitude                   : 77 deg 2' 11.40" W`,
        `GPS Position                    : 38.8975,-77.0365`,
        `Trailing Data After IEND        : 42180 bytes (7-Zip archive signature)`
      ].join("\r\n");

    case "binwalk":
      return [
        `DECIMAL       HEXADECIMAL     DESCRIPTION`,
        `--------------------------------------------------------------------------------`,
        `0             0x0             PNG image, 1920 x 1080, 8-bit/color RGBA`,
        `248012        0x3C8EC         7-Zip archive data, version 0.4`,
        `[+] Extracted 7-Zip payload containing classified_intel.pdf`
      ].join("\r\n");

    case "/opt/diagnostics/sysmon":
    case "sysmon":
      // Check if user has hijacked netstat in PATH
      if (state.env.PATH.startsWith("/tmp")) {
        state.isRoot = true;
        return `[PRIVILEGE ELEVATION] Running relative binary 'netstat' from /tmp/netstat...\r\nSpawned root subshell (uid=0).\r\nType 'cat /root/flag.txt' to retrieve the root master flag.`;
      }
      return "Running system diagnostic...\r\nExecuting 'netstat -tuln'...\r\nActive Internet connections (only servers):\r\nProto Recv-Q Send-Q Local Address           Foreign Address         State\r\ntcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN\r\ntcp        0      0 0.0.0.0:8088            0.0.0.0:*               LISTEN";

    case "export":
      if (args[0] && args[0].startsWith("PATH=")) {
        state.env.PATH = args[0].replace("PATH=", "");
        return `PATH updated: ${state.env.PATH}`;
      }
      return Object.entries(state.env).map(([k, v]) => `${k}=${v}`).join("\r\n");

    default:
      return `bash: ${binary}: command not found. Type 'help' for available utilities.`;
  }
}
