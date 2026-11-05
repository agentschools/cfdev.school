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
    const style = String(svg.properties.style);
    expect(style).toContain("--bg:var(--card-bg)");
    expect(style).toContain("--fg:var(--code-fg)");
    // Self-referential custom properties (`--fg:var(--fg)`, `--border:var(--border)`)
    // are cyclic in CSS and make every derived fill/stroke invalid (black-on-black).
    expect(style).not.toContain("--fg:var(--fg)");
    expect(style).not.toContain("--border:var(--border)");
  });
});
