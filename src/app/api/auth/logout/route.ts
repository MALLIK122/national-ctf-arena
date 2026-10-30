import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revokeSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get("ctf_session")?.value;
  if (token) {
    revokeSession(token, "USER_LOGOUT");
  }

  const response = NextResponse.json({ success: true, message: "Logged out successfully." });
  response.cookies.delete("ctf_session");
  return response;
}
