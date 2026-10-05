// Works out which preview pages a PR affects, so preview-env.mjs can list
// links to them at the end of the PR body once the preview is deployed.

import { readFileSync } from "node:fs";

const START = "<!-- preview-links:start -->";
const END = "<!-- preview-links:end -->";

/**
 * @param {{ filename: string, status: string, patch?: string }[]} files
 *   Entries from GitHub's "list pull request files" API.
 * @param {(path: string) => string} readFile Reads a file at the PR's head.
 * @returns {string[]} Preview paths, most specific first.
 */
export function previewPaths(files, readFile = (path) => readFileSync(path, "utf8")) {
  const paths = new Set();
  const add = (...items) => items.forEach((item) => paths.add(item));

  for (const { filename, status, patch } of files) {
    if (status === "removed" || /\.test\.[cm]?[jt]s$/.test(filename)) continue;

    if (/^src\/content\/lessons\/[^/]+\.md$/.test(filename)) {
      const slug = frontmatter(readFile(filename), "lessonSlug");
      if (slug) add(`/lessons/${slug}`, `/api/lessons/${slug}`);
    } else if (/^src\/content\/exercises\/[^/]+\.md$/.test(filename)) {
      const slug = frontmatter(readFile(filename), "exerciseSlug");
      if (slug) add(`/exercises/${slug}`);
    } else if (filename === "src/data/exercises.ts") {
      const slugs = changedEntries(readFile(filename), patch, /^ {2}slug: "([^"]+)"/);
      slugs.forEach((slug) => add(`/exercises/${slug}`, `/api/exercises/${slug}`));
      if (slugs.length === 0) add("/exercises");
    } else if (filename === "src/data/harnesses.ts") {
      changedEntries(readFile(filename), patch, /^ {4}id: "([^"]+)"/).forEach((id) =>
        add(`/api/harnesses/${id}`),
      );
      add("/");
    } else if (filename === "src/pages/llms.txt.ts") {
      add("/llms.txt");
    } else if (
      filename.startsWith("src/schemas/") ||
      filename === "src/lib/openapi.ts" ||
      filename === "src/pages/api/openapi.json.ts"
    ) {
      add("/api/openapi.json");
    } else if (filename === "src/pages/index.astro") {
      add("/");
    } else if (filename === "src/pages/disenroll.astro" || filename === "src/lib/disenroll-client.ts") {
      add("/disenroll");
    } else if (filename === "src/pages/exercises/index.astro") {
      add("/exercises");
    } else if (filename === "src/pages/lessons/[slug].astro" || filename === "src/lib/lesson-client.ts") {
      add("/lessons/interview");
    } else if (filename === "src/pages/exercises/[slug].astro" || filename === "src/lib/exercise-client.ts") {
      const first = readFile("src/data/exercises.ts").match(/^ {2}slug: "([^"]+)"/m);
      add(first ? `/exercises/${first[1]}` : "/exercises");
    }
  }

  if (paths.size === 0) add("/");
  return [...paths];
}

/**
 * Replaces (or appends) the preview links list at the end of a PR body.
 * @param {string | null} body
 * @param {string[]} urls
 */
export function updateBody(body, urls) {
  const pattern = new RegExp(`\\s*${START}[\\s\\S]*?${END}\\s*`, "g");
  const rest = (body || "").replace(pattern, "\n\n").trim();
  const list = urls.map((url) => `- ${url}`).join("\n");
  return `${rest ? `${rest}\n\n` : ""}${START}\n${list}\n${END}\n`;
}

function frontmatter(source, key) {
  return source.match(new RegExp(`^${key}:\\s*["']?([^"'\\s]+)`, "m"))?.[1];
}

/**
 * Finds the catalog entries a patch touches: for each changed line, the
 * nearest line above it (in the head version) matching `entryPattern`.
 */
function changedEntries(source, patch, entryPattern) {
  const lines = source.split("\n");
  const entries = new Set();

  for (const lineNumber of changedLines(patch)) {
    for (let i = Math.min(lineNumber, lines.length) - 1; i >= 0; i--) {
      const match = lines[i].match(entryPattern);
      if (match) {
        entries.add(match[1]);
        break;
      }
    }
  }

  return [...entries];
}

/** 1-indexed head-file line numbers of added lines and deletion points. */
function changedLines(patch = "") {
  const changed = [];
  let line = 0;

  for (const text of patch.split("\n")) {
    const hunk = text.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);
    if (hunk) {
      line = Number(hunk[1]);
    } else if (text.startsWith("+")) {
      changed.push(line++);
    } else if (text.startsWith("-")) {
      changed.push(line);
    } else if (!text.startsWith("\\")) {
      line++;
    }
  }

  return changed;
}
