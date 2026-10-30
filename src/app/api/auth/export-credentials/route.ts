import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Administrator access required." }, { status: 403 });
  }

  const db = getDb();
  const teams = db.prepare(`
    SELECT id, name, plain_password, disciplinary_status
    FROM teams
    ORDER BY id ASC
  `).all() as any[];

  const members = db.prepare(`
    SELECT team_id, member_slot, name, access_code
    FROM team_members
    ORDER BY team_id ASC, member_slot ASC
  `).all() as any[];

  // Group members by team
  const memberMap = new Map<string, any[]>();
  for (const m of members) {
    if (!memberMap.has(m.team_id)) memberMap.set(m.team_id, []);
    memberMap.get(m.team_id)!.push(m);
  }

  // Generate CSV rows
  const headers = [
    "Team ID",
    "Team Name",
    "Team Password",
    "Member 1 Name",
    "Member 1 Access Code",
    "Member 2 Name",
    "Member 2 Access Code",
    "Disciplinary Status"
  ];

  const rows = teams.map(t => {
    const tMembers = memberMap.get(t.id) || [];
    const m1 = tMembers.find(m => m.member_slot === 1) || { name: "", access_code: "" };
    const m2 = tMembers.find(m => m.member_slot === 2) || { name: "", access_code: "" };

    return [
      t.id,
      `"${t.name.replace(/"/g, '""')}"`,
      t.plain_password || "N/A",
      `"${m1.name.replace(/"/g, '""')}"`,
      m1.access_code,
      `"${m2.name.replace(/"/g, '""')}"`,
      m2.access_code,
      t.disciplinary_status
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\r\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="National_CTF_Cyber_Arena_All_50_Team_Credentials.csv"'
    }
  });
}
