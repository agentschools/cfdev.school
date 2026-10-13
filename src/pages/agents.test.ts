import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it, vi } from "vitest";
import { harnesses } from "../data/harnesses";

vi.mock("astro:content", async () => (await import("../test/fake-content")).fakeAstroContent);

async function render(): Promise<string> {
  const { default: Agents } = await import("./agents.astro");
  const container = await AstroContainer.create();
  return container.renderToString(Agents);
}

describe("/agents", () => {
  it("explains agents and harnesses, and recommends starting with Claude Code or Codex", async () => {
    const html = await render();
    expect(html).toContain("What&#39;s an agent?");
    expect(html).toContain("Agents and harnesses");
    expect(html).toContain("New to this? Start with Claude Code or Codex");
    expect(html).toContain("Other agents");
  });

  it("lists every supported harness from harnesses.ts, Claude Code and Codex first, with billing and homepage", async () => {
    const html = await render();
    const listed = harnesses.filter((harness) => harness.id !== "generic");
    const positions = listed.map((harness) => html.indexOf(`data-harness="${harness.id}"`));
    for (const position of positions) expect(position).toBeGreaterThan(-1);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(listed.slice(0, 2).map((harness) => harness.id)).toEqual(["claude-code", "codex"]);
    for (const harness of listed) {
      expect(html).toContain(harness.subscriptionBilling.headline.replaceAll("'", "&#39;"));
      if (harness.homepage) expect(html).toContain(`href="${harness.homepage}"`);
    }
    expect(html.match(/Good place to start/g)).toHaveLength(2);
    expect(html).not.toContain('data-harness="generic"');
  });
});
