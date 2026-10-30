import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const db = getDb();

  // Check if leaderboard is frozen
  const settings = db.prepare("SELECT is_leaderboard_frozen FROM competition_settings WHERE id = 'arena-global-settings'").get() as any;
  const isFrozen = Boolean(settings?.is_leaderboard_frozen);

  // Fetch all 50 teams with tie-breaking sorting
  // 1. total_score DESC
  // 2. last_solve_at ASC (NULLs last)
  // 3. solve_count DESC
  const teams = db.prepare(`
    SELECT 
      id, name, disciplinary_status, warning_count, total_score, solve_count,
      last_solve_at, is_online
    FROM teams
    ORDER BY 
      total_score DESC,
      CASE WHEN last_solve_at IS NULL THEN 1 ELSE 0 END,
      last_solve_at ASC,
      solve_count DESC,
      id ASC
  `).all() as any[];

  // Assign ranks
  let currentRank = 1;
  const rankedTeams = teams.map((team, idx) => {
    return {
      rank: currentRank++,
      id: team.id,
      name: team.name,
      score: team.total_score,
      solves: team.solve_count,
      lastSolveAt: team.last_solve_at,
      status: team.disciplinary_status,
      isOnline: Boolean(team.is_online),
      isDisqualified: team.disciplinary_status === "DISQUALIFIED",
      isSuspended: team.disciplinary_status === "WARNING_SUSPENDED"
    };
  });

  // Calculate statistics
  const totalSolves = db.prepare("SELECT count(*) as count FROM flag_submissions WHERE is_correct = 1").get() as { count: number };
  const totalSubmissions = db.prepare("SELECT count(*) as count FROM flag_submissions").get() as { count: number };
  const activeTeams = teams.filter(t => t.is_online).length;

  // Category breakdown
  const categorySolves = db.prepare(`
    SELECT c.category, count(fs.id) as count
    FROM flag_submissions fs
    JOIN challenges c ON fs.challenge_id = c.id
    WHERE fs.is_correct = 1
    GROUP BY c.category
  `).all() as any[];

  return NextResponse.json({
    leaderboard: rankedTeams,
    isFrozen,
    statistics: {
      totalTeams: teams.length,
      activeTeams,
      totalSolves: totalSolves.count,
      totalSubmissions: totalSubmissions.count,
      categorySolves
    }
  });
}
