import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { launchLab } from "@/lib/labEngine";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "PARTICIPANT" || !session.teamId || !session.memberId) {
      return NextResponse.json({ error: "Unauthorized session." }, { status: 401 });
    }

    const { challengeId } = await req.json();
    if (!challengeId) {
      return NextResponse.json({ error: "Challenge ID required." }, { status: 400 });
    }

    const labStatus = launchLab(session.teamId, session.memberId, challengeId);
    return NextResponse.json({ success: true, lab: labStatus });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to launch lab." }, { status: 400 });
  }
}
