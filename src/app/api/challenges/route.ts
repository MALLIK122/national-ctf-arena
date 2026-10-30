import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const db = getDb();

  // If authenticated participant, return their team's specific solve status and assignments
  if (session && session.role === "PARTICIPANT" && session.teamId) {
    const rows = db.prepare(`
      SELECT 
        c.id, c.title, c.category, c.difficulty, c.points, c.estimated_time_mins,
        c.description, c.has_live_lab, c.lab_type, c.order_index, c.prerequisites,
        ca.status as team_status, ca.solved_at, ca.attempts_count
      FROM challenges c
      LEFT JOIN challenge_assignments ca ON c.id = ca.challenge_id AND ca.team_id = ?
      WHERE c.is_active = 1
      ORDER BY c.order_index ASC
    `).all(session.teamId) as any[];

    // Parse prerequisites JSON
    const challenges = rows.map(r => ({
      ...r,
      hasLiveLab: Boolean(r.has_live_lab),
      isSolved: r.team_status === "SOLVED",
      prerequisites: JSON.parse(r.prerequisites || "[]")
    }));

    return NextResponse.json({ challenges });
  }

  // Public or Admin view (all active challenges without assigned dynamic flags)
  const rows = db.prepare(`
    SELECT id, title, category, difficulty, points, estimated_time_mins, description, has_live_lab, lab_type, order_index, prerequisites
    FROM challenges
    WHERE is_active = 1
    ORDER BY order_index ASC
  `).all() as any[];

  const challenges = rows.map(r => ({
    ...r,
    hasLiveLab: Boolean(r.has_live_lab),
    prerequisites: JSON.parse(r.prerequisites || "[]")
  }));

  return NextResponse.json({ challenges });
}
