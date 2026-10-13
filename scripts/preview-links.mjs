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

    const courseFile = filename.match(/^courses\/(?:[^/]+\/)?([^/]+)\/(COURSE\.md|exercises\/([^/]+)\.md)$/);
    if (courseFile) {
      // A course in a track (courses/<track>/<name>/) has the same flat URL as one that isn't.
      const [, course, file, exerciseFile] = courseFile;
      // Same slug rule as src/lib/course-format.ts: no leading number prefix.
      const page = exerciseFile ? `/courses/${course}/${exerciseFile.replace(/^\d+[-_]/, "")}` : `/courses/${course}`;
      add(page, `/courses/${course}/${file}`);
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
    } else if (
      filename === "src/pages/index.astro" ||
      filename === "src/lib/dashboard.ts" ||
      filename === "src/lib/dashboard-client.ts"
    ) {
      add("/");
    } else if (
      filename === "src/pages/authors.astro" ||
      filename === "src/lib/authors-client.ts" ||
      filename === "src/content/authors.md" ||
      filename === "src/pages/authors.md.ts"
    ) {
      add("/authors", "/authors.md");
    } else if (filename === "src/pages/agents.astro") {
      add("/agents");
    } else if (filename === "src/pages/disenroll.astro" || filename === "src/lib/disenroll-client.ts") {
      add("/disenroll");
    } else if (
      filename === "src/pages/profile.astro" ||
      filename === "src/lib/profile-client.ts" ||
      filename === "src/lib/course-progress.ts"
    ) {
      add("/profile");
    } else if (filename === "src/content/default-interview.md" || filename === "src/pages/default-interview.md.ts") {
      add("/courses/workers/interview", "/default-interview.md");
    } else if (filename === "src/content/external-courses.md" || filename === "src/pages/external-courses.md.ts") {
      add("/external-courses.md");
    } else if (filename === "src/data/courses.ts" || filename === "src/pages/courses/index.astro") {
      add("/courses");
    } else if (
      filename === "src/lib/courses.ts" ||
      filename === "src/lib/course-format.ts" ||
      filename === "src/pages/api/courses.ts"
    ) {
      add("/api/courses");
    } else if (filename === "src/pages/courses/[name]/index.astro" || filename === "src/lib/course-client.ts") {
      add("/courses/agent-setup");
    } else if (filename === "src/pages/courses/[name]/[exercise].astro" || filename === "src/lib/exercise-client.ts") {
      add("/courses/agent-setup/interview");
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
