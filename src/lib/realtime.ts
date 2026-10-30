// Server-Sent Events (SSE) in-memory subscription manager

type SSEClient = {
  id: string;
  role: "ADMIN" | "PARTICIPANT";
  teamId?: string;
  send: (data: string) => void;
};

// Global clients set
const clients = new Set<SSEClient>();

export function registerSSEClient(client: SSEClient) {
  clients.add(client);
  return () => {
    clients.delete(client);
  };
}

export function broadcastEvent(event: { type: string; payload: any; targetTeamId?: string }) {
  const json = JSON.stringify(event);
  const formatted = `data: ${json}\n\n`;

  for (const client of clients) {
    try {
      // If targetTeamId is specified, send only to matching team or admins
      if (event.targetTeamId) {
        if (client.role === "ADMIN" || client.teamId === event.targetTeamId) {
          client.send(formatted);
        }
      } else {
        client.send(formatted);
      }
    } catch (e) {
      clients.delete(client);
    }
  }
}
