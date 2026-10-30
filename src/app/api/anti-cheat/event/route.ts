import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { processViolationEvent } from "@/lib/antiCheat";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "PARTICIPANT" || !session.teamId || !session.memberId) {
      return NextResponse.json({ error: "Unauthorized session." }, { status: 401 });
    }

    const body = await req.json();
    const { eventType, details, evidenceData } = body;

    if (!eventType || !details) {
      return NextResponse.json({ error: "Missing event parameters." }, { status: 400 });
    }

    // Process violation atomically across the entire team
    const result = processViolationEvent({
      teamId: session.teamId,
      memberId: session.memberId,
      eventType,
      details,
      evidenceData: {
        ...evidenceData,
        memberName: session.memberName,
        memberSlot: session.memberSlot,
        userAgent: req.headers.get("user-agent") || "Unknown",
        clientTimestamp: new Date().toISOString()
      }
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Anti-cheat event endpoint error:", err);
    return NextResponse.json({ error: "Violation logging error." }, { status: 500 });
  }
}
