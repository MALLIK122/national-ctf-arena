import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { stopLab } from "@/lib/labEngine";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "PARTICIPANT" || !session.teamId) {
      return NextResponse.json({ error: "Unauthorized session." }, { status: 401 });
    }

    const { challengeId } = await req.json();
    if (!challengeId) {
      return NextResponse.json({ error: "Challenge ID required." }, { status: 400 });
    }

    stopLab(session.teamId, challengeId);
    return NextResponse.json({ success: true, message: "Lab stopped." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
