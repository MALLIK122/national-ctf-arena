import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "leaderboard";
  const db = getDb();

  if (type === "disciplinary") {
    const history = db.prepare(`
      SELECT 
        dh.timestamp, dh.team_id, t.name as team_name, dh.previous_status, 
        dh.new_status, dh.initiated_by, dh.reason
      FROM disciplinary_history dh
      JOIN teams t ON dh.team_id = t.id
      ORDER BY dh.timestamp DESC
    `).all() as any[];

    const headers = ["Timestamp", "Team ID", "Team Name", "Previous Status", "New Status", "Initiated By", "Reason"];
    const rows = history.map(h => [
      h.timestamp,
      h.team_id,
      `"${h.team_name.replace(/"/g, '""')}"`,
      h.previous_status,
      h.new_status,
      `"${h.initiated_by.replace(/"/g, '""')}"`,
      `"${(h.reason || '').replace(/"/g, '""')}"`
    ].join(","));

    return new NextResponse([headers.join(","), ...rows].join("\r\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="National_CTF_Disciplinary_Audit_Report.csv"'
      }
    });
  }

  // Final Leaderboard Report
  const teams = db.prepare(`
    SELECT 
      id, name, disciplinary_status, warning_count, total_score, solve_count, last_solve_at
    FROM teams
    ORDER BY 
      total_score DESC,
      CASE WHEN last_solve_at IS NULL THEN 1 ELSE 0 END,
      last_solve_at ASC,
      solve_count DESC
  `).all() as any[];

  const headers = ["Rank", "Team ID", "Team Name", "Total Score", "Challenges Solved", "Last Solve Timestamp", "Disciplinary Status", "Warnings Consumed"];
  let rank = 1;
  const rows = teams.map(t => [
    rank++,
    t.id,
    `"${t.name.replace(/"/g, '""')}"`,
    t.total_score,
    t.solve_count,
    t.last_solve_at || "N/A",
    t.disciplinary_status,
    t.warning_count
  ].join(","));

  return new NextResponse([headers.join(","), ...rows].join("\r\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="National_CTF_Final_Leaderboard_Report.csv"'
    }
  });
}
