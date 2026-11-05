import type { Element, ElementContent } from "hast";
import { describe, expect, it } from "vitest";
import { codeTitleTransformer, decodeXmlEntities } from "./code-highlighting";

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

  it("decodes entities in labels so quotes and ampersands render as typed", () => {
    const node: Element = { type: "element", tagName: "pre", properties: {}, children: [] };
    codeTitleTransformer.pre!.call(
      {
        options: { lang: "mermaid" },
        source: `flowchart LR\n  App["env.AI.run('dynamic/support')"] --> Gw["Logs & Cache"]`,
      } as never,
      node,
    );

    const text = textOf(node);
    expect(text).toContain("env.AI.run('dynamic/support')");
    expect(text).toContain("Logs & Cache");
    expect(text).not.toMatch(/&#?\w+;/);
  });
});

describe("decodeXmlEntities", () => {
  it("decodes the five named XML entities and numeric references", () => {
    expect(decodeXmlEntities("&lt;a&gt; &amp; &quot;b&quot; &apos;c&apos; &#39;d&#x27; &#x1F600;")).toBe(`<a> & "b" 'c' 'd' 😀`);
  });

  it("decodes in one pass, so an escaped entity stays literal", () => {
    expect(decodeXmlEntities("&amp;#39;")).toBe("&#39;");
  });
});

function textOf(node: Element | ElementContent): string {
  if (node.type === "text") return node.value;
  if (node.type !== "element") return "";
  return node.children.map(textOf).join(" ");
}
