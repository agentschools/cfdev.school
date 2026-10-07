import { DurableObject } from "cloudflare:workers";
import type { Progress } from "../schemas/progress";

/**
 * One instance per student (addressed by student ID). Browsers viewing the
 * site hold a hibernatable WebSocket to it; PUT/DELETE /api/progress and
 * PUT /api/students/{id}/interviews call broadcast() after writing to D1, so
 * the sidebar, course pages, exercise pages, and homepage update as soon as
 * the student's agent marks something complete or saves an interview.
 *
 * Hibernation means idle connections don't keep the object (or its billing)
 * awake. The "ping" -> "pong" auto-response answers client keepalives without
 * waking it either.
 */
export class ProgressHub extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  async fetch(): Promise<Response> {
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  broadcast(progress: Progress): void {
    const message = JSON.stringify(progress);
    for (const socket of this.ctx.getWebSockets()) {
      // A tab that just closed can still be listed; don't let it block the rest.
      try {
        socket.send(message);
      } catch {
        // Ignored: that tab re-fetches progress when it reconnects.
      }
    }
  }
}
