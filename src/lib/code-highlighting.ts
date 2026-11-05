import type { Element, ElementContent } from "hast";
import type { LanguageRegistration, ShikiTransformer, ThemeRegistration } from "shiki";
import { renderMermaidSVG } from "beautiful-mermaid";
import yaml from "shiki/langs/yaml.mjs";

// Code block colors are CSS variables (set in Layout.astro), so highlighting
// follows the student's color and light/dark mode with no per-theme CSS:
// grayscale for punctuation and comments, the student's link color for
// keywords, and a grayer mix of it for strings. Design: "Code — A (Accent
// keywords)" in Paper's cfdev.school file (#143).
const color = (role: string) => `var(--code-${role})`;

export const codeTheme: ThemeRegistration = {
  name: "cf-dev-school",
  type: "light",
  colors: {
    "editor.foreground": color("fg"),
    "editor.background": "var(--card-bg)",
  },
  tokenColors: [
    { scope: ["punctuation", "meta.brace", "keyword.operator"], settings: { foreground: color("muted") } },
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: color("muted"), fontStyle: "italic" } },
    {
      scope: [
        "keyword",
        "storage",
        "keyword.operator.new",
        "keyword.operator.expression",
        "punctuation.definition.template-expression",
        "constant.numeric",
        "constant.language",
        "entity.name.type",
        "support.type.primitive",
        "support.type.builtin",
        "constant.other.option",
        "markup.heading",
        "punctuation.definition.heading",
      ],
      settings: { foreground: color("keyword") },
    },
    { scope: ["string", "punctuation.definition.string", "markup.inline.raw"], settings: { foreground: color("string") } },
    {
      scope: ["meta.template.expression", "support.type.property-name", "entity.name.tag.yaml", "string.unquoted.argument"],
      settings: { foreground: color("fg") },
    },
    {
      scope: ["entity.name.function", "support.function", "entity.name.type.class"],
      settings: { foreground: color("fg"), fontStyle: "bold" },
    },
    { scope: ["markup.heading", "markup.bold"], settings: { fontStyle: "bold" } },
    { scope: ["markup.italic"], settings: { fontStyle: "italic" } },
  ],
};

// Grammars loaded up front: Markdown blocks only highlight their frontmatter
// when YAML is already loaded, since Shiki loads embedded grammars lazily.
export const codeLangs: LanguageRegistration[] = [...yaml];

const TERMINAL_LANGS = new Set(["sh", "bash", "shell", "zsh", "console"]);

const TERMINAL_ICON: Element = {
  type: "element",
  tagName: "svg",
  properties: {
    viewBox: "0 0 24 24",
    width: 14,
    height: 14,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ariaHidden: "true",
  },
  children: [
    { type: "element", tagName: "path", properties: { d: "m4 17 6-5-6-5" }, children: [] },
    { type: "element", tagName: "path", properties: { d: "M12 19h8" }, children: [] },
  ],
};

/** The `title="..."` from a fence's meta string, e.g. ```ts title="src/index.ts". */
export function codeTitle(meta: string | undefined): string | undefined {
  return meta?.match(/(?:^|\s)title="([^"]+)"/)?.[1];
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

/** Converts the well-formed XML string from `renderMermaidSVG` into a HAST Element. */
function svgToHast(xml: string): Element {
  const root: Element = { type: "element", tagName: "root", properties: {}, children: [] };
  const stack: Element[] = [root];
  const tokenPattern = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z0-9:_-]+)([^>]*?)(\/?)>|([^<]+)/g;
  for (const match of xml.matchAll(tokenPattern)) {
    const [, closing, tag, attrString, selfClosing, text] = match;
    if (text !== undefined) {
      const parent = stack[stack.length - 1];
      if (text.trim() || parent.tagName === "text" || parent.tagName === "style") {
        parent.children.push({ type: "text", value: decodeXmlEntities(text) });
      }
      continue;
    }
    if (!tag) continue;
    if (closing) {
      stack.pop();
      continue;
    }
    const properties: Record<string, string> = {};
    for (const attr of attrString.matchAll(/([a-zA-Z0-9:_-]+)="([^"]*)"/g)) {
      properties[attr[1]] = decodeXmlEntities(attr[2]);
    }
    const element: Element = { type: "element", tagName: tag, properties, children: [] };
    stack[stack.length - 1].children.push(element);
    if (!selfClosing) stack.push(element);
  }
  return root.children[0] as Element;
}

/**
 * Puts a label at the top of a code block: the fence's `title`, or "Terminal"
 * for shell blocks without one. Copy buttons copy the <code> only, so the
 * label isn't copied with it. Also renders ```mermaid fences into theme-aware
 * inline SVGs at build time.
 */
export const codeTitleTransformer: ShikiTransformer = {
  name: "cf-dev-school:code-title",
  pre(node) {
    if (this.options.lang === "mermaid") {
      // Avoid `--fg:var(--fg)` and `--border:var(--border)` on `<svg style>`,
      // which create CSS custom-property self-cycles and make fills/strokes invalid.
      const svg = renderMermaidSVG(this.source, {
        bg: "var(--card-bg)",
        fg: "var(--code-fg)",
        muted: "var(--muted-fg)",
        accent: "var(--accent-text)",
        font: "system-ui",
        transparent: true,
      }).replace(/@import url\([^)]+\);\s*/g, "");
      node.tagName = "figure";
      node.properties = { className: ["mermaid-diagram"] };
      node.children = [svgToHast(svg)];
      return;
    }
    const title = codeTitle(this.options.meta?.__raw);
    const terminal = !title && TERMINAL_LANGS.has(this.options.lang);
    if (!title && !terminal) return;
    const children: ElementContent[] = terminal ? [TERMINAL_ICON, { type: "text", value: "Terminal" }] : [{ type: "text", value: title! }];
    node.children.unshift({ type: "element", tagName: "span", properties: { className: ["code-title"] }, children });
  },
};
