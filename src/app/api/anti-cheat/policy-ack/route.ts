import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "PARTICIPANT" || !session.memberId) {
    return NextResponse.json({ error: "Unauthorized session." }, { status: 401 });
  }

  const db = getDb();
  db.prepare(`
    UPDATE team_members 
    SET policy_accepted = 1, policy_accepted_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(session.memberId);

  return NextResponse.json({ success: true, message: "Policy acknowledged." });
}
