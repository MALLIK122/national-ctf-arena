import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { validateFlag } from "@/lib/flagEngine";
import { broadcastEvent } from "@/lib/realtime";

// In-memory rate limiting map: teamId -> timestamp
const lastSubmissionMap = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "PARTICIPANT" || !session.teamId || !session.memberId) {
      return NextResponse.json({ error: "Unauthorized session." }, { status: 401 });
    }

    const db = getDb();

    // 1. Check Team Disciplinary Status Server-Side
    const team = db.prepare(`
      SELECT id, name, disciplinary_status, warning_count, total_score, solve_count 
      FROM teams WHERE id = ?
    `).get(session.teamId) as any;

    if (!team) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    if (team.disciplinary_status === "WARNING_SUSPENDED") {
      return NextResponse.json(
        { error: "SUBMISSION BLOCKED: Your team is currently suspended due to a competition policy violation. Contact an administrator." },
        { status: 403 }
      );
    }

    if (team.disciplinary_status === "DISQUALIFIED") {
      return NextResponse.json(
        { error: "SUBMISSION BLOCKED: Your team has been disqualified from the competition." },
        { status: 403 }
      );
    }

    // 2. Check Competition Global Status
    const settings = db.prepare("SELECT status, allow_submissions FROM competition_settings WHERE id = 'arena-global-settings'").get() as any;
    if (settings && (settings.status === "FINISHED" || !settings.allow_submissions)) {
      return NextResponse.json(
        { error: "Competition has concluded or submissions are temporarily paused by the administrator." },
        { status: 403 }
      );
    }

    // 3. Anti-Brute-Force Rate Limiting (1 request per 3 seconds per team)
    const now = Date.now();
    const lastSub = lastSubmissionMap.get(session.teamId) || 0;
    if (now - lastSub < 2500) {
      return NextResponse.json(
        { error: "Rate limit: Please wait a moment between flag submissions." },
        { status: 429 }
      );
    }
    lastSubmissionMap.set(session.teamId, now);

    const body = await req.json();
    const { challengeId, flag } = body;

    if (!challengeId || !flag || typeof flag !== "string") {
      return NextResponse.json({ error: "Challenge ID and flag string are required." }, { status: 400 });
    }

    const cleanFlag = flag.trim();

    // Begin atomic transaction
    db.exec("BEGIN IMMEDIATE TRANSACTION;");

    try {
      // Fetch challenge assignment and base challenge
      const assignment = db.prepare(`
        SELECT ca.*, c.points, c.base_flag, c.title as challenge_title, c.category
        FROM challenge_assignments ca
        JOIN challenges c ON ca.challenge_id = c.id
        WHERE ca.team_id = ? AND ca.challenge_id = ?
      `).get(session.teamId, challengeId) as any;

      if (!assignment) {
        db.exec("ROLLBACK;");
        return NextResponse.json({ error: "Challenge is not assigned or available for your team." }, { status: 404 });
      }

      // 4. Duplicate Check
      if (assignment.status === "SOLVED") {
        db.exec("ROLLBACK;");
        return NextResponse.json({
          success: false,
          alreadySolved: true,
          message: "This challenge has already been solved by your team. No duplicate points awarded."
        });
      }

      // 5. Server-Side Flag Validation
      const isCorrect = validateFlag(cleanFlag, assignment.assigned_flag, assignment.base_flag);

      // Check hint penalties
      const hintPenalties = db.prepare(`
        SELECT COALESCE(SUM(penalty_points), 0) as total_penalty
        FROM hint_unlocks
        WHERE team_id = ? AND challenge_id = ?
      `).get(session.teamId, challengeId) as { total_penalty: number };

      const penalty = hintPenalties?.total_penalty || 0;
      const netPoints = isCorrect ? Math.max(10, assignment.points - penalty) : 0;

      // Record submission log
      const submissionId = `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      db.prepare(`
        INSERT INTO flag_submissions (id, team_id, member_id, challenge_id, submitted_flag, is_correct, points_awarded, hint_penalty_points, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        submissionId,
        session.teamId,
        session.memberId,
        challengeId,
        cleanFlag,
        isCorrect ? 1 : 0,
        netPoints,
        penalty,
        req.headers.get("x-forwarded-for") || "127.0.0.1"
      );

      // Increment attempt counter
      db.prepare(`
        UPDATE challenge_assignments 
        SET attempts_count = attempts_count + 1, last_attempt_at = CURRENT_TIMESTAMP
        WHERE team_id = ? AND challenge_id = ?
      `).run(session.teamId, challengeId);

      if (!isCorrect) {
        db.exec("COMMIT;");

        // Broadcast to admin live submission stream
        broadcastEvent({
          type: "FLAG_SUBMISSION",
          payload: {
            submissionId,
            teamId: session.teamId,
            teamName: team.name,
            memberName: session.memberName,
            challengeId,
            challengeTitle: assignment.challenge_title,
            isCorrect: false,
            timestamp: new Date().toISOString()
          }
        });

        return NextResponse.json({
          success: false,
          isCorrect: false,
          message: "Incorrect flag. Review your findings and try again."
        });
      }

      // 6. Award Points and Update Team Status Atomically
      const solveTime = new Date().toISOString();
      db.prepare(`
        UPDATE challenge_assignments 
        SET status = 'SOLVED', solved_at = ?, solved_by_member_id = ?
        WHERE team_id = ? AND challenge_id = ?
      `).run(solveTime, session.memberId, session.teamId, challengeId);

      const newScore = team.total_score + netPoints;
      const newSolveCount = team.solve_count + 1;

      db.prepare(`
        UPDATE teams 
        SET total_score = ?, solve_count = ?, last_solve_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newScore, newSolveCount, solveTime, session.teamId);

      // Check if this solve unlocks prerequisite challenges
      const lockedChals = db.prepare(`
        SELECT c.id, c.prerequisites, ca.status
        FROM challenges c
        JOIN challenge_assignments ca ON c.id = ca.challenge_id AND ca.team_id = ?
        WHERE ca.status = 'LOCKED'
      `).all(session.teamId) as any[];

      for (const locked of lockedChals) {
        const prereqs: string[] = JSON.parse(locked.prerequisites || "[]");
        if (prereqs.includes(challengeId)) {
          // Check if all prereqs for this challenge are now solved
          const allSolved = prereqs.every(pId => {
            const check = db.prepare(`
              SELECT status FROM challenge_assignments 
              WHERE team_id = ? AND challenge_id = ?
            `).get(session.teamId, pId) as any;
            return check && check.status === "SOLVED";
          });

          if (allSolved) {
            db.prepare(`
              UPDATE challenge_assignments 
              SET status = 'AVAILABLE' 
              WHERE team_id = ? AND challenge_id = ?
            `).run(session.teamId, locked.id);
          }
        }
      }

      db.exec("COMMIT;");

      // Broadcast solve to Leaderboard and Admin Monitoring
      broadcastEvent({
        type: "LEADERBOARD_UPDATE",
        payload: {
          teamId: session.teamId,
          teamName: team.name,
          newScore,
          newSolveCount,
          lastSolveAt: solveTime,
          solvedChallenge: {
            id: challengeId,
            title: assignment.challenge_title,
            category: assignment.category,
            points: netPoints
          }
        }
      });

      broadcastEvent({
        type: "FLAG_SUBMISSION",
        payload: {
          submissionId,
          teamId: session.teamId,
          teamName: team.name,
          memberName: session.memberName,
          challengeId,
          challengeTitle: assignment.challenge_title,
          isCorrect: true,
          pointsAwarded: netPoints,
          timestamp: solveTime
        }
      });

      return NextResponse.json({
        success: true,
        isCorrect: true,
        pointsAwarded: netPoints,
        newTotalScore: newScore,
        message: `Flag accepted! Awarded ${netPoints} points.`
      });
    } catch (innerErr: any) {
      db.exec("ROLLBACK;");
      throw innerErr;
    }
  } catch (err: any) {
    console.error("Flag submission error:", err);
    return NextResponse.json({ error: "Flag processing failure." }, { status: 500 });
  }
}
