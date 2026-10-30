import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { executeLabCommand } from "@/lib/labEngine";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "PARTICIPANT" || !session.teamId) {
      return NextResponse.json({ error: "Unauthorized session." }, { status: 401 });
    }

    // Check suspension
    const db = getDb();
    const team = db.prepare("SELECT disciplinary_status FROM teams WHERE id = ?").get(session.teamId) as any;
    if (team?.disciplinary_status === "WARNING_SUSPENDED" || team?.disciplinary_status === "DISQUALIFIED") {
      return NextResponse.json({ error: "Terminal blocked: Team is currently suspended or locked." }, { status: 403 });
    }

    const { challengeId, command } = await req.json();
    if (!challengeId || typeof command !== "string") {
      return NextResponse.json({ error: "Challenge ID and command required." }, { status: 400 });
    }

    const output = executeLabCommand(session.teamId, challengeId, command);
    return NextResponse.json({ success: true, output });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
