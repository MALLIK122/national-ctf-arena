import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { INITIAL_CHALLENGES } from "@/lib/challenges-data";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "PARTICIPANT" || !session.teamId || !session.memberId) {
      return NextResponse.json({ error: "Unauthorized session." }, { status: 401 });
    }

    const { challengeId, hintIndex } = await req.json();
    if (!challengeId || typeof hintIndex !== "number") {
      return NextResponse.json({ error: "Challenge ID and hint index required." }, { status: 400 });
    }

    const db = getDb();
    const chal = INITIAL_CHALLENGES.find(c => c.id === challengeId);
    if (!chal || !chal.hints[hintIndex]) {
      return NextResponse.json({ error: "Invalid hint requested." }, { status: 404 });
    }

    const targetHint = chal.hints[hintIndex];

    // Check if already unlocked
    const existing = db.prepare(`
      SELECT * FROM hint_unlocks 
      WHERE team_id = ? AND challenge_id = ? AND hint_index = ?
    `).get(session.teamId, challengeId, hintIndex);

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyUnlocked: true,
        hintText: targetHint.text
      });
    }

    // Insert unlock record
    db.prepare(`
      INSERT INTO hint_unlocks (id, team_id, member_id, challenge_id, hint_index, penalty_points)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      `HINT-${session.teamId}-${challengeId}-${hintIndex}`,
      session.teamId,
      session.memberId,
      challengeId,
      hintIndex,
      targetHint.cost
    );

    return NextResponse.json({
      success: true,
      hintText: targetHint.text,
      penaltyPoints: targetHint.cost
    });
  } catch (err: any) {
    console.error("Hint unlock error:", err);
    return NextResponse.json({ error: "Failed to unlock hint." }, { status: 500 });
  }
}
