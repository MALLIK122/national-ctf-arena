import crypto from "node:crypto";
import { INITIAL_CHALLENGES } from "./challenges-data";

/**
 * Computes a secure, team-specific dynamic flag for a given challenge.
 * This guarantees that Team A's flag will NOT work for Team B, preventing
 * collusion, flag sharing, or unauthorized leaks.
 */
export function generateTeamFlag(teamId: string, challengeId: string, baseFlag: string, flagSalt: string): string {
  // Extract inner text inside CTF{...}
  const match = baseFlag.match(/CTF\{([^}]+)\}/i);
  if (!match) return baseFlag;

  const inner = match[1];
  
  // Compute deterministic HMAC using salt and teamId
  const hmac = crypto.createHmac("sha256", `CTF_SECRET_${flagSalt}`)
    .update(`${teamId}:${challengeId}`)
    .digest("hex")
    .substring(0, 8); // 8-char unique team variant suffix

  return `CTF{${inner}_${hmac}}`;
}

/**
 * Validates a submitted flag for a specific team.
 * Checks against the dynamic assigned flag, or if static, against the base flag.
 */
export function validateFlag(submitted: string, assignedFlag: string, baseFlag?: string): boolean {
  if (!submitted || typeof submitted !== "string") return false;
  const cleanSubmitted = submitted.trim();
  
  // Direct match with team's assigned flag
  if (cleanSubmitted === assignedFlag.trim()) {
    return true;
  }

  // Also support base flag if challenge is static/common
  if (baseFlag && cleanSubmitted === baseFlag.trim()) {
    return true;
  }

  return false;
}
