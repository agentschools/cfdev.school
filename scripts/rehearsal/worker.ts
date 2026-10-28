import { DurableObject } from "cloudflare:workers";
import { BACKGROUND_CONTEXT as context } from "@earendil-works/chord/context";
import { Type } from "@earendil-works/pi-ai";
import { createModels, hasApi } from "@earendil-works/pi-ai/models";
import { cloudflareAIGatewayProvider } from "@earendil-works/pi-ai/providers/cloudflare-ai-gateway";
import { AssistantEntry, createRegistry, defineExtension, Harness, section, watchEvents, type ToolRegistration } from "@earendil-works/pi-durable";
import { openDurableObjectSqliteStorage } from "@earendil-works/pi-durable/storage/sqlite/cloudflare";
import { checkModelRequest, checkSchoolRequest, localOrigin, MAX_OUTPUT_TOKENS, MAX_REQUESTS, MODEL, RESERVATION_USD } from "./policy.mjs";

type Session = { studentId: string; origin: string; prompt: string; turns: number };

export class Rehearsal extends DurableObject<RehearsalEnv> {
  private busy = false;

  async fetch(request: Request): Promise<Response> {
    if (request.method === "GET") {
      return Response.json({ ready: Boolean(this.env.CF_AIG_TOKEN && this.env.CLOUDFLARE_ACCOUNT_ID && this.env.CLOUDFLARE_GATEWAY_ID && this.env.UNIFIED_BILLING_CONFIRMED === "true"), transcript: await this.ctx.storage.get("transcript"), session: await this.ctx.storage.get("session"), calls: (await this.ctx.storage.get<number>("calls")) ?? 0, maxRequests: MAX_REQUESTS, reservedUSDPerRequest: RESERVATION_USD });
    }
    if (request.method !== "POST" || this.busy) return new Response("Busy or unsupported method", { status: 409 });
    this.busy = true;
    try {
      if (Number(request.headers.get("content-length") ?? 0) > 12_000) throw new Error("Input too large");
      const raw = await request.text();
      if (raw.length > 12_000) throw new Error("Input too large");
      const body = JSON.parse(raw);
      let session = await this.ctx.storage.get<Session>("session");
      if (!session) {
        const origin = localOrigin(body.origin);
        if (typeof body.prompt !== "string" || typeof body.studentId !== "string" || !body.prompt.includes(body.studentId) || !body.prompt.includes(`${origin}/llms.txt`)) throw new Error("Missing actual browser prompt");
        checkSchoolRequest(body.studentId, "GET", "/llms.txt", undefined);
        session = { studentId: body.studentId, origin, prompt: body.prompt, turns: 0 };
        await this.ctx.storage.put("session", session);
      } else if (body.studentId !== session.studentId || body.origin !== session.origin) {
        throw new Error("One student per spike; no implicit budget reset");
      }
      if (session.turns >= 4) throw new Error("Student-turn budget exhausted");
      const input = session.turns === 0 ? session.prompt : body.reply;
      if (typeof input !== "string" || input.length > 6000) throw new Error("Invalid student input");
      const requestId = `student-${session.turns}`;
      // A lost response is deliberately not retried: inspect the persisted transcript first.
      await this.ctx.storage.put("session", { ...session, turns: session.turns + 1 });
      return await this.turn(session, input, requestId);
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : "Rehearsal failed", outcome: "blocked" }, { status: 400 });
    } finally {
      this.busy = false;
    }
  }

  private async turn(session: Session, input: string, requestId: string): Promise<Response> {
    const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_GATEWAY_ID: gateway, CF_AIG_TOKEN: token } = this.env;
    if (!account || !gateway || !token || this.env.UNIFIED_BILLING_CONFIRMED !== "true") throw new Error("Gateway access and Unified Billing verification required");
    const provider = cloudflareAIGatewayProvider();
    const model = provider.getModels().find(m => m.id === MODEL);
    if (!model || model.api !== "anthropic-messages" || model.cost.input !== 2 || model.cost.output !== 10 || model.cost.cacheWrite > 2.5) throw new Error("Requested model/pricing unavailable; no substitution");
    const guardedFetch: typeof fetch = async (url, init) => {
      const req = new Request(url, init);
      const payload = await req.clone().json() as Record<string, unknown>;
      checkModelRequest(req.url, payload, account, gateway, (await this.ctx.storage.get<number>("calls")) ?? 0);
      // No await between reading and incrementing inside this transaction: simultaneous dispatches cannot overspend.
      await this.ctx.storage.transaction(async tx => {
        const calls = (await tx.get<number>("calls")) ?? 0;
        if (calls >= MAX_REQUESTS) throw new Error("Spike request budget exhausted");
        await tx.put("calls", calls + 1);
      });
      const headers = new Headers(req.headers);
      headers.delete("x-api-key");
      headers.delete("authorization");
      headers.set("cf-aig-authorization", `Bearer ${token}`);
      headers.set("cf-aig-skip-cache", "true");
      return fetch(new Request(req, { headers, redirect: "error", signal: AbortSignal.timeout(45_000) }));
    };
    const models = createModels({ authContext: { env: async name => ({ CLOUDFLARE_API_KEY: "injected-at-dispatch", CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_GATEWAY_ID: gateway })[name], fileExists: async () => false } });
    models.setProvider({ ...provider, streamSimple: (model, messages, options) => {
      if (!hasApi(model, "anthropic-messages")) throw new Error("Unexpected model API");
      return provider.streamSimple(model, messages, { ...options, maxTokens: MAX_OUTPUT_TOKENS, maxRetries: 0, fetch: guardedFetch });
    } });
    const school: ToolRegistration = {
      name: "school_http",
      description: "Fetch the school instructions or call its documented API. Paths are relative to the school origin in the student's prompt. Only the interview milestone is available.",
      parameters: Type.Object({ method: Type.Union([Type.Literal("GET"), Type.Literal("PUT")]), path: Type.String(), body: Type.Optional(Type.Unknown()) }),
      replay: "safe",
      execute: async (args: { method: string; path: string; body?: Record<string, unknown> }) => {
        checkSchoolRequest(session.studentId, args.method, args.path, args.body);
        const response = await this.env.SCHOOL.fetch(`${session.origin}${args.path}`, {
          method: args.method, redirect: "error", signal: AbortSignal.timeout(10_000),
          headers: { Origin: session.origin, "Content-Type": "application/json" },
          body: args.body === undefined ? undefined : JSON.stringify(args.body),
        });
        const text = await response.text();
        if (text.length > 35_000) throw new Error("School response too large");
        return { output: [{ type: "text", text: `${response.status}\n${text}` }] };
      },
    };
    const extension = defineExtension({ name: "rehearsal", tools: [school], sections: [section("preamble", () => "You are Pi Durable, the student's real Pi harness (harness ID pi). Your model ID is claude-sonnet-5-5. Follow the school fetched from the actual student prompt. Pause for student answers. This run stops after the drawing-game interview. Do not complete any later exercise. No shell, deployment or payments are available.", { tag: false })] });
    const registry = createRegistry();
    registry.install(extension);
    const harness = await Harness.open(await openDurableObjectSqliteStorage(this.ctx.storage), {
      models, registry,
      settings: { extensions: [extension], retry: { enabled: false, maxRetries: 0 }, stream: { maxRetries: 0, timeoutMs: 45_000 }, compaction: { enabled: false }, restartLimit: 1, documentRetentionMs: 0 },
    }, context);
    try {
      const root = await harness.root(context, { agent: { model: { provider: provider.id, modelId: MODEL }, thinkingLevel: "low", tools: [school] } });
      const submission = await root.submit({ type: "input", content: input, requestId }, context);
      const settled = await submission.wait(context);
      const answer = settled.status === "done" && settled.type === "input" ? await root.commit(tx => tx.entry(AssistantEntry, settled.answer), context) : undefined;
      const events = await watchEvents(harness, root.id, context);
      const transcript = events.snapshot;
      await events.stop();
      await this.ctx.storage.put("transcript", transcript);
      return Response.json({ settled, answer: answer?.model, transcript, calls: await this.ctx.storage.get("calls"), coverage: "real Pi Durable; drawing-game interview only; no canvas, Clef or deployment" });
    } finally {
      await harness.close(context);
    }
  }
}

export default {
  async fetch(request: Request, env: RehearsalEnv): Promise<Response> {
    if (env.REHEARSAL_LOCAL_ONLY !== "true") return new Response("Local-only prototype", { status: 403 });
    try { localOrigin(request.url); } catch { return new Response("Local-only prototype", { status: 403 }); }
    // Exactly one durable ledger for this entire spike, including all attempted student turns.
    return env.RUN.getByName("drawing-interview-spike-v1").fetch(request);
  },
} satisfies ExportedHandler<RehearsalEnv>;
