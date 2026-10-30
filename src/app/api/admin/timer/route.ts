import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { broadcastEvent } from "@/lib/realtime";

export async function GET(req: NextRequest) {
  const db = getDb();
  const settings = db.prepare("SELECT * FROM competition_settings WHERE id = 'arena-global-settings'").get() as any;

  if (!settings) {
    return NextResponse.json({
      status: "WAITING",
      remainingSeconds: 10800,
      durationSeconds: 10800,
      isLeaderboardFrozen: false
    });
  }

  // Calculate elapsed if running
  let remaining = settings.remaining_seconds;
  if (settings.status === "RUNNING" && settings.started_at) {
    const elapsedSec = Math.floor((Date.now() - new Date(settings.started_at).getTime()) / 1000);
    remaining = Math.max(0, settings.duration_seconds - elapsedSec);

    // If time reached 0, transition to FINISHED
    if (remaining === 0) {
      db.prepare(`
        UPDATE competition_settings 
        SET status = 'FINISHED', remaining_seconds = 0, ended_at = CURRENT_TIMESTAMP, is_leaderboard_frozen = 1
        WHERE id = 'arena-global-settings'
      `).run();
    }
  }

  return NextResponse.json({
    status: settings.status,
    remainingSeconds: remaining,
    durationSeconds: settings.duration_seconds,
    isLeaderboardFrozen: Boolean(settings.is_leaderboard_frozen),
    allowSubmissions: Boolean(settings.allow_submissions)
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const { action, durationSeconds, freezeLeaderboard } = await req.json();
  const db = getDb();

  const current = db.prepare("SELECT * FROM competition_settings WHERE id = 'arena-global-settings'").get() as any;

  if (action === "START") {
    const dur = durationSeconds || current.duration_seconds || 10800; // 3 hours
    db.prepare(`
      UPDATE competition_settings 
      SET status = 'RUNNING', started_at = CURRENT_TIMESTAMP, duration_seconds = ?, remaining_seconds = ?, allow_submissions = 1
      WHERE id = 'arena-global-settings'
    `).run(dur, dur);

    broadcastEvent({
      type: "TIMER_UPDATE",
      payload: { status: "RUNNING", remainingSeconds: dur, durationSeconds: dur }
    });

    return NextResponse.json({ success: true, message: "Competition started. 3-Hour timer is running!" });
  }

  if (action === "PAUSE") {
    // Calculate remaining
    const elapsed = Math.floor((Date.now() - new Date(current.started_at).getTime()) / 1000);
    const rem = Math.max(0, current.duration_seconds - elapsed);

    db.prepare(`
      UPDATE competition_settings 
      SET status = 'PAUSED', remaining_seconds = ?, paused_at = CURRENT_TIMESTAMP, allow_submissions = 0
      WHERE id = 'arena-global-settings'
    `).run(rem);

    broadcastEvent({
      type: "TIMER_UPDATE",
      payload: { status: "PAUSED", remainingSeconds: rem }
    });

    return NextResponse.json({ success: true, message: "Competition paused." });
  }

  if (action === "RESUME") {
    const rem = current.remaining_seconds || 10800;
    // Set started_at back so remaining lines up
    const adjustedStart = new Date(Date.now() - (current.duration_seconds - rem) * 1000).toISOString();

    db.prepare(`
      UPDATE competition_settings 
      SET status = 'RUNNING', started_at = ?, allow_submissions = 1
      WHERE id = 'arena-global-settings'
    `).run(adjustedStart);

    broadcastEvent({
      type: "TIMER_UPDATE",
      payload: { status: "RUNNING", remainingSeconds: rem }
    });

    return NextResponse.json({ success: true, message: "Competition resumed." });
  }

  if (action === "END") {
    db.prepare(`
      UPDATE competition_settings 
      SET status = 'FINISHED', remaining_seconds = 0, ended_at = CURRENT_TIMESTAMP, is_leaderboard_frozen = 1, allow_submissions = 0
      WHERE id = 'arena-global-settings'
    `).run();

    // Clean up active labs
    db.prepare("UPDATE lab_instances SET status = 'STOPPED' WHERE status IN ('STARTING', 'RUNNING')").run();

    broadcastEvent({
      type: "TIMER_UPDATE",
      payload: { status: "FINISHED", remainingSeconds: 0 }
    });

    return NextResponse.json({ success: true, message: "Competition ended. Submissions blocked and scores finalized." });
  }

  if (action === "TOGGLE_FREEZE") {
    const newFreeze = freezeLeaderboard !== undefined ? freezeLeaderboard : (current.is_leaderboard_frozen ? 0 : 1);
    db.prepare("UPDATE competition_settings SET is_leaderboard_frozen = ? WHERE id = 'arena-global-settings'").run(newFreeze ? 1 : 0);

    broadcastEvent({
      type: "LEADERBOARD_FROZEN",
      payload: { isFrozen: Boolean(newFreeze) }
    });

    return NextResponse.json({ success: true, isFrozen: Boolean(newFreeze) });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
