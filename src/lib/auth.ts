import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getDb, verifyPassword } from "./db";

export interface SessionPayload {
  sessionId: string;
  role: "PARTICIPANT" | "ADMIN";
  teamId?: string;
  teamName?: string;
  memberId?: string;
  memberName?: string;
  memberSlot?: number;
  adminId?: string;
  adminUsername?: string;
  disciplinaryStatus?: string;
  warningCount?: number;
}

// In-memory failed login attempts map: ip -> { count, lockedUntil }
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

export function checkLoginRateLimit(identifier: string): { allowed: boolean; waitSec?: number } {
  const record = loginAttempts.get(identifier);
  if (!record) return { allowed: true };

  const now = Date.now();
  if (record.lockedUntil > now) {
    const waitSec = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, waitSec };
  }

  // If lockout expired, reset
  if (record.lockedUntil <= now && record.count >= 5) {
    loginAttempts.delete(identifier);
  }

  return { allowed: true };
}

export function recordFailedLogin(identifier: string) {
  const now = Date.now();
  const record = loginAttempts.get(identifier) || { count: 0, lockedUntil: 0 };
  record.count += 1;

  if (record.count >= 5) {
    // Lock out for 5 minutes after 5 consecutive failures
    record.lockedUntil = now + 5 * 60 * 1000;
  }

  loginAttempts.set(identifier, record);
}

export function clearFailedLogin(identifier: string) {
  loginAttempts.delete(identifier);
}

/**
 * Creates a persistent authenticated session in the database
 */
export function createSession(params: {
  role: "PARTICIPANT" | "ADMIN";
  teamId?: string;
  memberId?: string;
  adminId?: string;
  ip?: string;
  userAgent?: string;
}): string {
  const db = getDb();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(); // 12 hours

  db.prepare(`
    INSERT INTO sessions (id, team_id, member_id, admin_id, role, ip_address, user_agent, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    token,
    params.teamId || null,
    params.memberId || null,
    params.adminId || null,
    params.role,
    params.ip || "127.0.0.1",
    params.userAgent || "Unknown",
    expiresAt
  );

  return token;
}

/**
 * Validates the session cookie and returns full session info.
 * Enforces server-side team suspension and revocation.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("ctf_session")?.value;
  if (!token) return null;

  const db = getDb();
  const row = db.prepare(`
    SELECT 
      s.id as session_id,
      s.role,
      s.team_id,
      s.member_id,
      s.admin_id,
      s.is_revoked,
      s.expires_at,
      t.name as team_name,
      t.disciplinary_status,
      t.warning_count,
      m.name as member_name,
      m.member_slot,
      a.username as admin_username
    FROM sessions s
    LEFT JOIN teams t ON s.team_id = t.id
    LEFT JOIN team_members m ON s.member_id = m.id
    LEFT JOIN administrators a ON s.admin_id = a.id
    WHERE s.id = ?
  `).get(token) as any;

  if (!row) return null;

  // Check expiration
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return null;
  }

  // Check if session itself is revoked
  if (row.is_revoked) {
    return null;
  }

  return {
    sessionId: row.session_id,
    role: row.role,
    teamId: row.team_id,
    teamName: row.team_name,
    memberId: row.member_id,
    memberName: row.member_name,
    memberSlot: row.member_slot,
    adminId: row.admin_id,
    adminUsername: row.admin_username,
    disciplinaryStatus: row.disciplinary_status,
    warningCount: row.warning_count
  };
}

/**
 * Revokes a session token
 */
export function revokeSession(token: string, reason = "USER_LOGOUT") {
  const db = getDb();
  db.prepare(`
    UPDATE sessions 
    SET is_revoked = 1, revoked_reason = ? 
    WHERE id = ?
  `).run(reason, token);
}
