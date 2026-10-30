import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getActiveLab } from "@/lib/labEngine";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const challengeId = params.id;
  const db = getDb();
  const session = await getSession();

  const chal = db.prepare(`
    SELECT id, title, category, difficulty, points, estimated_time_mins, description, instructions, scenario, has_live_lab, lab_type, lab_port, prerequisites, hints
    FROM challenges
    WHERE id = ? AND is_active = 1
  `).get(challengeId) as any;

  if (!chal) {
    return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
  }

  let teamAssignment = null;
  let unlockedHints: number[] = [];
  let activeLab = null;

  if (session && session.role === "PARTICIPANT" && session.teamId) {
    teamAssignment = db.prepare(`
      SELECT status, solved_at, attempts_count
      FROM challenge_assignments
      WHERE team_id = ? AND challenge_id = ?
    `).get(session.teamId, challengeId);

    const hintRows = db.prepare(`
      SELECT hint_index FROM hint_unlocks
      WHERE team_id = ? AND challenge_id = ?
    `).all(session.teamId, challengeId) as any[];

    unlockedHints = hintRows.map(h => h.hint_index);
    activeLab = getActiveLab(session.teamId);
  }

  const rawHints = JSON.parse(chal.hints || "[]");
  // Redact hint text if not unlocked by team
  const hints = rawHints.map((h: any, idx: number) => {
    const isUnlocked = unlockedHints.includes(idx);
    return {
      id: h.id || idx,
      index: idx,
      cost: h.cost,
      isUnlocked,
      text: isUnlocked ? h.text : `[Locked - costs ${h.cost} points]`
    };
  });

  return NextResponse.json({
    challenge: {
      ...chal,
      hasLiveLab: Boolean(chal.has_live_lab),
      prerequisites: JSON.parse(chal.prerequisites || "[]"),
      hints,
      teamAssignment,
      activeLab: activeLab && activeLab.challengeId === challengeId ? activeLab : null
    }
  });
}
