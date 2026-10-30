import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { broadcastEvent } from "@/lib/realtime";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const { teamId, action, reason } = await req.json();
  if (!teamId) {
    return NextResponse.json({ error: "Team ID required." }, { status: 400 });
  }

  const db = getDb();
  db.exec("BEGIN IMMEDIATE TRANSACTION;");

  try {
    if (action === "DISQUALIFY") {
      db.prepare(`
        UPDATE teams 
        SET disciplinary_status = 'DISQUALIFIED',
            suspension_reason = ?,
            suspended_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(reason || "Admin confirmed disqualification.", teamId);

      // Invalidate sessions
      db.prepare("UPDATE sessions SET is_revoked = 1, revoked_reason = 'ADMIN_DISQUALIFIED' WHERE team_id = ?").run(teamId);

      // Stop active labs
      db.prepare("UPDATE lab_instances SET status = 'STOPPED' WHERE team_id = ?").run(teamId);

      // Audit trail
      db.prepare(`
        INSERT INTO disciplinary_history (id, team_id, previous_status, new_status, reason, initiated_by)
        VALUES (?, ?, 'UNKNOWN', 'DISQUALIFIED', ?, ?)
      `).run(`DISC-${Date.now()}`, teamId, reason || "Manual admin disqualification", `ADMIN:${session.adminUsername}`);

      db.exec("COMMIT;");

      broadcastEvent({
        type: "TEAM_STATUS_CHANGED",
        payload: { teamId, status: "DISQUALIFIED", reason }
      });

      return NextResponse.json({ success: true, message: `Team ${teamId} permanently disqualified.` });
    }

    if (action === "REVERSE") {
      // Super admin reversal
      db.prepare(`
        UPDATE teams 
        SET disciplinary_status = 'ACTIVE',
            suspension_reason = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(teamId);

      // Audit trail
      db.prepare(`
        INSERT INTO disciplinary_history (id, team_id, previous_status, new_status, reason, initiated_by)
        VALUES (?, ?, 'DISQUALIFIED', 'ACTIVE', ?, ?)
      `).run(`DISC-REVERSE-${Date.now()}`, teamId, reason || "Super Admin reversal of penalty", `ADMIN:${session.adminUsername}`);

      db.exec("COMMIT;");

      broadcastEvent({
        type: "TEAM_STATUS_CHANGED",
        payload: { teamId, status: "ACTIVE" }
      });

      return NextResponse.json({ success: true, message: `Disqualification reversed for ${teamId}.` });
    }

    db.exec("ROLLBACK;");
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    db.exec("ROLLBACK;");
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
