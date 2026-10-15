import { describe, expect, it } from "vitest";

// Every heading in course content uses sentence case (see AGENTS.md,
// "Titles"): only the first word and proper nouns are capitalized. Acronyms
// like CLI or AGENTS.md are always allowed. Add new product names here.
const PROPER_NOUNS = [
  "AI Gateway",
  "Claude Code",
  "Clef",
  "Cloudflare",
  "Code Mode",
  "Codex",
  "Dev School",
  "Durable Objects",
  "OpenCode",
  "Pi",
  "Worker",
  "Workers",
  "Wrangler",
];

const files = import.meta.glob<string>(["/courses/**/*.md", "/src/content/*.md"], {
  query: "?raw",
  import: "default",
  eager: true,
});

/** Every Markdown heading's text, outside frontmatter and fenced code blocks. */
function headings(markdown: string): string[] {
  const found: string[] = [];
  let fence: string | undefined;
  for (const line of markdown.replace(/^---\n[\s\S]*?\n---\n/, "").split("\n")) {
    const marker = line.match(/^\s*(```|~~~)/)?.[1];
    if (marker) {
      if (!fence) fence = marker;
      else if (marker === fence) fence = undefined;
      continue;
    }
    const heading = !fence && line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/);
    if (heading) found.push(heading[1]);
  }
  return found;
}

/** Words after the first that are capitalized but aren't proper nouns or acronyms. */
function miscapitalized(heading: string): string[] {
  let text = heading.replace(/`[^`]*`/g, "code");
  for (const noun of PROPER_NOUNS) text = text.replace(new RegExp(`\\b${noun}\\b`, "g"), "noun");
  return text
    .split(/\s+/)
    .slice(1)
    .filter((word) => /^[A-Z](?![A-Z0-9])/.test(word));
}

describe("headings", () => {
  it("are checked by a rule that catches title case", () => {
    expect(miscapitalized("Add A Binding")).toEqual(["A", "Binding"]);
    expect(miscapitalized("Deploy a Worker with the CLI, D1, and `Cf`")).toEqual([]);
  });

  for (const [path, markdown] of Object.entries(files)) {
    it(`use sentence case in ${path}`, () => {
      for (const heading of headings(markdown)) expect(miscapitalized(heading), heading).toEqual([]);
    });
  }
});
