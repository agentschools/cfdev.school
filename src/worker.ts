import { handle } from "@astrojs/cloudflare/handler";
import { env as globalEnv } from "cloudflare:workers";
import { studentIdSchema } from "./schemas/student";

export { ProgressHub } from "./durable-objects/progress-hub";

const LIVE_PROGRESS_PATH = /^\/api\/progress\/([^/]+)\/live$/;

/**
 * Custom Worker entry (wrangler.jsonc `main`) so we can export the
 * ProgressHub Durable Object class. WebSocket upgrades for live progress are
 * routed straight to the student's ProgressHub, before Astro sees the
 * request; everything else goes to Astro as usual.
 */
export default {
  async fetch(request, env, ctx) {
    const match = new URL(request.url).pathname.match(LIVE_PROGRESS_PATH);
    if (match && request.headers.get("Upgrade") === "websocket") {
      const studentId = studentIdSchema.safeParse(match[1]);
      if (!studentId.success) return new Response("Invalid student ID", { status: 400 });
      return globalEnv.PROGRESS_HUB.getByName(studentId.data).fetch(request);
    }
    return handle(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
