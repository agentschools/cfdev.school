import type { Element, ElementContent } from "hast";
import type { LanguageRegistration, ShikiTransformer, ThemeRegistration } from "shiki";
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

/**
 * Puts a label at the top of a code block: the fence's `title`, or "Terminal"
 * for shell blocks without one. Copy buttons copy the <code> only, so the
 * label isn't copied with it.
 */
export const codeTitleTransformer: ShikiTransformer = {
  name: "cf-dev-school:code-title",
  pre(node) {
    const title = codeTitle(this.options.meta?.__raw);
    const terminal = !title && TERMINAL_LANGS.has(this.options.lang);
    if (!title && !terminal) return;
    const children: ElementContent[] = terminal ? [TERMINAL_ICON, { type: "text", value: "Terminal" }] : [{ type: "text", value: title! }];
    node.children.unshift({ type: "element", tagName: "span", properties: { className: ["code-title"] }, children });
  },
};
