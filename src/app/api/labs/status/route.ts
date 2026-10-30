import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getActiveLab } from "@/lib/labEngine";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "PARTICIPANT" || !session.teamId) {
    return NextResponse.json({ error: "Unauthorized session." }, { status: 401 });
  }

  const lab = getActiveLab(session.teamId);
  return NextResponse.json({ activeLab: lab });
}
