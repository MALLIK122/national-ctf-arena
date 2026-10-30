import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { INITIAL_CHALLENGES } from "../challenges-data";
import { generateTeamFlag } from "../flagEngine";

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, "national_ctf.db");
  const db = new DatabaseSync(dbPath);

  // Enable WAL mode and foreign keys for high-performance concurrent transactions
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA synchronous = NORMAL;");

  // Read and initialize schema
  const schemaPath = path.join(process.cwd(), "src", "lib", "db", "schema.sql");
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");
    db.exec(schemaSql);
  }

  // Ensure default data (50 teams, admin, challenges, settings)
  initDefaultData(db);

  dbInstance = db;
  return db;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;
    const computedHash = crypto.pbkdf2Sync(password, salt, 10000, 32, "sha256").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(computedHash, "hex"));
  } catch (err) {
    return false;
  }
}

function initDefaultData(db: DatabaseSync) {
  // Check if admin exists
  const adminCheck = db.prepare("SELECT count(*) as count FROM administrators").get() as { count: number };
  if (adminCheck.count === 0) {
    const adminPassHash = hashPassword("Admin2026!NationalArena");
    db.prepare(`
      INSERT INTO administrators (id, username, password_hash, display_name, role)
      VALUES (?, ?, ?, ?, ?)
    `).run("admin-001", "admin", adminPassHash, "Competition Director", "SUPER_ADMIN");
  }

  // Check if competition settings exist
  const settingsCheck = db.prepare("SELECT count(*) as count FROM competition_settings").get() as { count: number };
  if (settingsCheck.count === 0) {
    db.prepare(`
      INSERT INTO competition_settings (id, title, status, duration_seconds, remaining_seconds, is_leaderboard_frozen, allow_submissions, anti_cheat_grace_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run("arena-global-settings", "NATIONAL CTF CYBER ARENA", "WAITING", 10800, 10800, 0, 1, 3000);
  }

  // Check if challenges exist
  const challengesCheck = db.prepare("SELECT count(*) as count FROM challenges").get() as { count: number };
  if (challengesCheck.count === 0) {
    const insertChal = db.prepare(`
      INSERT INTO challenges (
        id, title, category, difficulty, points, estimated_time_mins,
        description, instructions, scenario, base_flag, is_dynamic_flag,
        flag_salt, has_live_lab, lab_type, lab_port, prerequisites, hints, order_index
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const c of INITIAL_CHALLENGES) {
      insertChal.run(
        c.id,
        c.title,
        c.category,
        c.difficulty,
        c.points,
        c.estimatedTimeMins,
        c.description,
        c.instructions,
        c.scenario,
        c.baseFlag,
        c.flagSalt ? 1 : 0,
        c.flagSalt,
        c.hasLiveLab ? 1 : 0,
        c.labType || null,
        c.labPort || null,
        JSON.stringify(c.prerequisites),
        JSON.stringify(c.hints),
        c.orderIndex
      );
    }
  }

  // Pre-create 50 Teams (CTF-TEAM-001 through CTF-TEAM-050)
  const teamsCheck = db.prepare("SELECT count(*) as count FROM teams").get() as { count: number };
  if (teamsCheck.count === 0) {
    const teamInsert = db.prepare(`
      INSERT INTO teams (id, name, password_hash, plain_password, disciplinary_status, warning_count, total_score, solve_count)
      VALUES (?, ?, ?, ?, 'ACTIVE', 0, 0, 0)
    `);

    const memberInsert = db.prepare(`
      INSERT INTO team_members (id, team_id, member_slot, name, access_code)
      VALUES (?, ?, ?, ?, ?)
    `);

    const assignInsert = db.prepare(`
      INSERT INTO challenge_assignments (id, team_id, challenge_id, assigned_flag, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    const teamNames = [
      "CyberVanguard", "ZeroDay Syndicate", "Ironclad Sentinel", "Apex Shadows", "NullPointer Security",
      "Quantum Threat Ops", "RedTeam Nexus", "Kernel Panic Elite", "DarkByte Division", "GhostWire Defense",
      "Binary Titans", "CipherSec Unit", "Spectral Recon", "ByteStorm Security", "Cryptic Enclave",
      "Valkyrie Cyber", "Obsidian Core", "Overclocked Sentinels", "Titanium Guard", "RootShell Alliance",
      "Packet Stormers", "Firewall Phantoms", "Aegis CyberCorp", "ShadowProtocol", "VectorStrike",
      "DeepPacket Labs", "Hexadecimal Hunters", "BlackHat Breakers", "CryptoCommand", "ProxyForce",
      "BufferOverflow Ops", "CyberShield Brigade", "SynAck Brigade", "Payload Pioneers", "ReverseEng Lab",
      "Subnet Strikers", "LogicBomb Squad", "Terminal Velocity", "CodeBreaker Unit", "NeonVortex",
      "NetSec Paladins", "Defcon Operatives", "CyberPhoenix", "Vulnerability Vault", "DarkWeb Watchers",
      "StegoSpectres", "Bypass Battalion", "Malware Matrix", "Infosec Vanguard", "National Apex Team"
    ];

    for (let i = 1; i <= 50; i++) {
      const numStr = i.toString().padStart(3, "0");
      const teamId = `CTF-TEAM-${numStr}`;
      const teamName = teamNames[i - 1] || `Cyber Squad ${numStr}`;
      
      // Deterministic yet secure generation for reproducible demo credentials
      const plainPassword = `Arena2026#${teamId.toLowerCase()}`;
      const passHash = hashPassword(plainPassword);

      teamInsert.run(teamId, teamName, passHash, plainPassword);

      // Create Member 1 and Member 2
      const m1AccessCode = `ACC-${numStr}-A`;
      const m2AccessCode = `ACC-${numStr}-B`;

      memberInsert.run(`${teamId}-M1`, teamId, 1, `Operative Alpha (${numStr})`, m1AccessCode);
      memberInsert.run(`${teamId}-M2`, teamId, 2, `Operative Bravo (${numStr})`, m2AccessCode);

      // Assign all challenges with team-specific dynamic flags
      for (const chal of INITIAL_CHALLENGES) {
        const dynamicFlag = generateTeamFlag(teamId, chal.id, chal.baseFlag, chal.flagSalt);
        const initialStatus = chal.prerequisites.length === 0 ? "AVAILABLE" : "LOCKED";

        assignInsert.run(
          `ASSIGN-${teamId}-${chal.id}`,
          teamId,
          chal.id,
          dynamicFlag,
          initialStatus
        );
      }
    }
  }
}
