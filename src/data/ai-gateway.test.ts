import { afterEach, describe, expect, it, vi } from "vitest";
import ts from "typescript";
import { parse as parseYaml } from "yaml";
import seeEveryRequest from "../../courses/fundamentals/ai-gateway/exercises/01-see-every-request.md?raw";
import blockBadPrompts from "../../courses/fundamentals/ai-gateway/exercises/05-block-bad-prompts.md?raw";
import capRequestsAndSpend from "../../courses/fundamentals/ai-gateway/exercises/03-cap-requests-and-spend.md?raw";

// Execute the actual student-facing snippet with a fake binding. No inference,
// credentials, or Cloudflare resources are used by these regression checks.
const snippet = seeEveryRequest.match(/```ts title="src\/index.ts"\n([\s\S]*?)\n```/)![1];
const javascript = ts.transpile(snippet, { target: ts.ScriptTarget.ES2022 });
const ask = new Function("env", "prompt", "user", "team", "skipCache", `
  return (async () => { ${javascript} })();
`) as (env: object, prompt: string, user: string, team: string, skipCache: boolean) => Promise<Response>;

function request(run: ReturnType<typeof vi.fn>) {
  return ask({ AI: { run, lastRequestHttpStatusCode: 429, aiGatewayLogId: "stale-log" } }, "Hello", "alex", "interns", true);
}

afterEach(() => vi.restoreAllMocks());

describe("AI Gateway lab response handling", () => {
  it.each([
    { format: "classic", answer: { response: "Hello back" }, expected: "Hello back" },
    { format: "OpenAI", answer: { choices: [{ message: { content: "Hello back" } }] }, expected: "Hello back" },
    { format: "empty choices", answer: { choices: [] }, expected: { choices: [] } },
    { format: "missing message", answer: { choices: [{}] }, expected: { choices: [{}] } },
  ])("keeps the $format answer, metadata, cache bypass, and per-response log ID", async ({ answer, expected }) => {
    const run = vi.fn().mockResolvedValue(Response.json(answer, {
      headers: { "cf-aig-log-id": "this-call" },
    }));
    const response = await request(run);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ response: expected, logId: "this-call", metadata: { user: "alex", team: "interns" } });
    expect(run).toHaveBeenCalledWith("@cf/google/gemma-4-26b-a4b-it", { messages: [{ role: "user", content: "Hello" }] }, {
      gateway: { id: "dev-school-gateway", metadata: { user: "alex", team: "interns" }, skipCache: true },
      returnRawResponse: true,
    });
  });

  it("returns 429 for a confirmed limit response", async () => {
    const response = await request(vi.fn().mockResolvedValue(new Response("Limit exceeded", {
      status: 429, headers: { "cf-aig-log-id": "limit-call" },
    })));
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "AI request limit reached", logId: "limit-call" });
  });

  it.each([400, 401, 403, 404, 408, 413, 500, 503])("preserves upstream %i without labeling it as a limit", async (status) => {
    const response = await request(vi.fn().mockResolvedValue(new Response("Upstream failure", { status })));
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error: "AI request failed", logId: null });
  });

  it("preserves a Guardrails 424 and its own log ID without exposing the response body", async () => {
    const response = await request(vi.fn().mockResolvedValue(new Response("Prompt blocked due to security configurations", {
      status: 424, headers: { "cf-aig-log-id": "guardrails-call" },
    })));
    expect(response.status).toBe(424);
    expect(await response.json()).toEqual({ error: "AI request failed", logId: "guardrails-call" });
    expect(blockBadPrompts).toContain("non-OK responses do not throw");
    expect(blockBadPrompts).toContain("including `424` for a Guardrails block");
  });

  it.each([Response.error(), new Response("Unexpected redirect", { status: 302 })])("uses 502 for a non-error HTTP status: %s", async (upstream) => {
    const response = await request(vi.fn().mockResolvedValue(upstream));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "AI request failed", logId: null });
  });

  it.each([
    new TypeError("Network failure"),
    Object.assign(new Error("Local failure"), { status: 429 }),
    Object.assign(new Error("7003: User Input Error"), { name: "AiGatewayError" }),
  ])("does not reuse a stale 429 or log ID when the binding throws: %s", async (error) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await request(vi.fn().mockRejectedValue(error));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "AI request failed", logId: null });
  });
});

describe("spend limit teaching", () => {
  const [, yaml, body] = capRequestsAndSpend.split(/^---\n/m);
  const instructions = (parseYaml(yaml) as { "agent-instructions": string })["agent-instructions"];

  it("distinguishes the pre-forward check from post-completion accounting in both views", () => {
    for (const content of [instructions, body]) {
      expect(content).toMatch(/before (?:forwarding|forwarding a request)/i);
      expect(content).toContain("cost is recorded after completion");
      expect(content).toContain("eventually consistent");
      expect(content).toMatch(/concurrent requests can briefly overshoot/);
      expect(content).not.toMatch(/(?:evaluated|enforced) (?:right )?after (?:a request finishes|completion)/);
    }
    expect(instructions).not.toMatch(/45.?60 seconds/);
    expect(instructions).toContain("recorded cumulative spend");
    expect(instructions).toContain("confirm the spend-limit reason and rule");
  });
});
