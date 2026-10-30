import { NextRequest } from "next/server";
import { registerSSEClient } from "@/lib/realtime";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const role = session?.role || "PARTICIPANT";
  const teamId = session?.teamId;

  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      const encoder = new TextEncoder();
      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(data));
        } catch (e) {
          // Stream might be closed
        }
      };

      // Send initial heartbeat
      send(`: connected as ${role}\n\n`);

      cleanup = registerSSEClient({
        id: clientId,
        role: role as any,
        teamId,
        send
      });

      // Keep connection alive with 15s comments
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch (e) {
          clearInterval(interval);
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        if (cleanup) cleanup();
      });
    },
    cancel() {
      if (cleanup) cleanup();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive"
    }
  });
}
