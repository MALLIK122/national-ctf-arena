import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { broadcastEvent } from "@/lib/realtime";

export async function GET(req: NextRequest) {
  const db = getDb();
  const announcements = db.prepare(`
    SELECT * FROM announcements ORDER BY created_at DESC LIMIT 20
  `).all();
  return NextResponse.json({ announcements });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const { title, message, priority } = await req.json();
  if (!title || !message) {
    return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
  }

  const db = getDb();
  const id = `ANN-${Date.now()}`;
  db.prepare(`
    INSERT INTO announcements (id, title, message, priority, created_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, title, message, priority || "NORMAL", session.adminUsername || "Admin");

  broadcastEvent({
    type: "ANNOUNCEMENT",
    payload: { id, title, message, priority: priority || "NORMAL", createdAt: new Date().toISOString() }
  });

  return NextResponse.json({ success: true, id });
}
