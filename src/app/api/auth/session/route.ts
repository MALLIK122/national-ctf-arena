import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const db = getDb();

  // If participant, fetch latest team status, policy status and scores
  if (session.role === "PARTICIPANT" && session.teamId) {
    const team = db.prepare(`
      SELECT id, name, disciplinary_status, warning_count, suspension_reason, total_score, solve_count
      FROM teams WHERE id = ?
    `).get(session.teamId) as any;

    const member = db.prepare(`
      SELECT id, name, member_slot, policy_accepted, access_code
      FROM team_members WHERE id = ?
    `).get(session.memberId) as any;

    return NextResponse.json({
      authenticated: true,
      role: "PARTICIPANT",
      team: {
        id: team?.id,
        name: team?.name,
        disciplinaryStatus: team?.disciplinary_status,
        warningCount: team?.warning_count,
        suspensionReason: team?.suspension_reason,
        totalScore: team?.total_score,
        solveCount: team?.solve_count
      },
      member: {
        id: member?.id,
        name: member?.name,
        slot: member?.member_slot,
        policyAccepted: Boolean(member?.policy_accepted),
        accessCode: member?.access_code
      }
    });
  }

  // Admin session
  return NextResponse.json({
    authenticated: true,
    role: "ADMIN",
    admin: {
      id: session.adminId,
      username: session.adminUsername
    }
  });
}
