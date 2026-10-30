import { NextRequest, NextResponse } from "next/server";
import { getDb, verifyPassword } from "@/lib/db";
import { checkLoginRateLimit, recordFailedLogin, clearFailedLogin, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Unknown";

    const body = await req.json();
    const { loginType, teamId, accessCode, password, username } = body;

    // Check rate limiting
    const rateCheck = checkLoginRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many failed login attempts. Temporarily locked for ${rateCheck.waitSec} seconds.` },
        { status: 429 }
      );
    }

    const db = getDb();

    // 1. ADMIN LOGIN FLOW
    if (loginType === "ADMIN" || username) {
      const admin = db.prepare("SELECT * FROM administrators WHERE username = ?").get(username) as any;
      if (!admin || !verifyPassword(password, admin.password_hash)) {
        recordFailedLogin(ip);
        return NextResponse.json({ error: "Invalid administrator credentials." }, { status: 401 });
      }

      clearFailedLogin(ip);
      const token = createSession({
        role: "ADMIN",
        adminId: admin.id,
        ip,
        userAgent
      });

      const response = NextResponse.json({
        success: true,
        role: "ADMIN",
        username: admin.username,
        displayName: admin.display_name
      });

      response.cookies.set("ctf_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 12 * 60 * 60
      });

      return response;
    }

    // 2. PARTICIPANT TEAM LOGIN FLOW
    if (!teamId || !password || !accessCode) {
      return NextResponse.json(
        { error: "Team ID, Team Password, and Member Access Code are required." },
        { status: 400 }
      );
    }

    const team = db.prepare("SELECT * FROM teams WHERE id = ?").get(teamId.toUpperCase().trim()) as any;
    if (!team) {
      recordFailedLogin(ip);
      return NextResponse.json({ error: "Invalid Team ID or Password." }, { status: 401 });
    }

    // Verify team password
    if (!verifyPassword(password, team.password_hash)) {
      recordFailedLogin(ip);
      return NextResponse.json({ error: "Invalid Team ID or Password." }, { status: 401 });
    }

    // Check disciplinary lockout
    if (team.disciplinary_status === "DISQUALIFIED") {
      return NextResponse.json(
        { error: "TEAM DISQUALIFIED: Your team has exceeded the permitted competition policy violations. Contact the competition administrator." },
        { status: 403 }
      );
    }

    if (team.disciplinary_status === "WARNING_SUSPENDED") {
      return NextResponse.json(
        { error: "TEAM SUSPENDED: A competition policy violation has been detected from one of your team members. Your entire team has been temporarily suspended. Contact the competition administrator." },
        { status: 403 }
      );
    }

    // Verify Member Access Code
    const member = db.prepare(`
      SELECT * FROM team_members 
      WHERE team_id = ? AND (access_code = ? OR access_code = ?)
    `).get(team.id, accessCode.trim(), accessCode.toUpperCase().trim()) as any;

    if (!member) {
      recordFailedLogin(ip);
      return NextResponse.json(
        { error: `Invalid Member Access Code for ${team.id}. Please use your assigned access code (e.g. ACC-XXX-A or ACC-XXX-B).` },
        { status: 401 }
      );
    }

    clearFailedLogin(ip);

    // Create session
    const token = createSession({
      role: "PARTICIPANT",
      teamId: team.id,
      memberId: member.id,
      ip,
      userAgent
    });

    // Mark online
    db.prepare("UPDATE teams SET is_online = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(team.id);
    db.prepare("UPDATE team_members SET is_online = 1, last_active_at = CURRENT_TIMESTAMP, last_ip = ? WHERE id = ?").run(ip, member.id);

    const response = NextResponse.json({
      success: true,
      role: "PARTICIPANT",
      teamId: team.id,
      teamName: team.name,
      memberId: member.id,
      memberName: member.name,
      memberSlot: member.member_slot,
      disciplinaryStatus: team.disciplinary_status,
      policyAccepted: Boolean(member.policy_accepted)
    });

    response.cookies.set("ctf_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 12 * 60 * 60
    });

    return response;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Authentication system error." }, { status: 500 });
  }
}
