import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb, hashPassword } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const db = getDb();
  const teams = db.prepare(`
    SELECT 
      t.id, t.name, t.disciplinary_status, t.warning_count, t.suspension_reason,
      t.suspended_at, t.reinstated_at, t.reinstated_by, t.total_score, t.solve_count,
      t.last_solve_at, t.is_online, t.created_at,
      COUNT(DISTINCT sa.id) as violation_count
    FROM teams t
    LEFT JOIN security_alerts sa ON t.id = sa.team_id
    GROUP BY t.id
    ORDER BY t.id ASC
  `).all() as any[];

  const members = db.prepare(`
    SELECT id, team_id, member_slot, name, access_code, is_online, policy_accepted, last_active_at, last_ip
    FROM team_members
    ORDER BY team_id ASC, member_slot ASC
  `).all() as any[];

  // Group members
  const memberMap = new Map<string, any[]>();
  for (const m of members) {
    if (!memberMap.has(m.team_id)) memberMap.set(m.team_id, []);
    memberMap.get(m.team_id)!.push(m);
  }

  const result = teams.map(t => ({
    ...t,
    isOnline: Boolean(t.is_online),
    members: memberMap.get(t.id) || []
  }));

  return NextResponse.json({ teams: result });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const body = await req.json();
  const { action, teamId, newPassword, newStatus } = body;
  const db = getDb();

  if (action === "RESET_PASSWORD" && teamId && newPassword) {
    const hashed = hashPassword(newPassword);
    db.prepare(`
      UPDATE teams 
      SET password_hash = ?, plain_password = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(hashed, newPassword, teamId);

    return NextResponse.json({ success: true, message: `Password reset for ${teamId}.` });
  }

  if (action === "UPDATE_STATUS" && teamId && newStatus) {
    db.prepare(`
      UPDATE teams 
      SET disciplinary_status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(newStatus, teamId);

    return NextResponse.json({ success: true, message: `Status updated for ${teamId}.` });
  }

  if (action === "RESET_PROGRESS" && teamId) {
    db.exec("BEGIN IMMEDIATE TRANSACTION;");
    try {
      db.prepare("UPDATE teams SET total_score = 0, solve_count = 0, last_solve_at = NULL WHERE id = ?").run(teamId);
      db.prepare("UPDATE challenge_assignments SET status = 'AVAILABLE', solved_at = NULL, solved_by_member_id = NULL, attempts_count = 0 WHERE team_id = ?").run(teamId);
      db.prepare("DELETE FROM flag_submissions WHERE team_id = ?").run(teamId);
      db.prepare("DELETE FROM hint_unlocks WHERE team_id = ?").run(teamId);
      db.exec("COMMIT;");
      return NextResponse.json({ success: true, message: `Progress reset for ${teamId}.` });
    } catch (err: any) {
      db.exec("ROLLBACK;");
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
