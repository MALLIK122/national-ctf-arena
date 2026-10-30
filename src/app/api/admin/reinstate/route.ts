import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { reinstateTeamFirstWarning } from "@/lib/antiCheat";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Administrator privileges required." }, { status: 403 });
  }

  const { teamId } = await req.json();
  if (!teamId) {
    return NextResponse.json({ error: "Team ID is required." }, { status: 400 });
  }

  const result = reinstateTeamFirstWarning(teamId, session.adminUsername || "SuperAdmin");
  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json(result);
}
