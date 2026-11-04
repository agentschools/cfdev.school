import type { Element } from "hast";
import { describe, expect, it } from "vitest";
import { codeTitleTransformer } from "./code-highlighting";

describe("codeTitleTransformer", () => {
  it("renders ```mermaid fences into a <figure class=\"mermaid-diagram\"> with an inline <svg>", () => {
    const node: Element = { type: "element", tagName: "pre", properties: {}, children: [] };
    codeTitleTransformer.pre!.call(
      {
        options: { lang: "mermaid" },
        source: "flowchart LR\n  Worker[Your Worker] --> Gateway[AI Gateway]",
      } as never,
      node,
    );

    expect(node.tagName).toBe("figure");
    expect(node.properties.className).toEqual(["mermaid-diagram"]);
    const svg = node.children[0] as Element;
    expect(svg.tagName).toBe("svg");
    expect(String(svg.properties.style)).toContain("--bg:var(--card-bg)");
    expect(String(svg.properties.style)).toContain("--fg:var(--fg)");
  });
});
