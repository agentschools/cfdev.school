// Update the checked-in skill and runtime rules together, from an exact upstream commit.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const repository = "https://github.com/agentschools/course-spec";
const skillPath = ".agents/skills/create-course";
const lockPath = ".agents/course-spec.json";
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const filesIn = (directory) => readdirSync(directory, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => join(entry.parentPath, entry.name).slice(directory.length + 1))
  .sort();

export function checkCourseSkill(project = root) {
  const lock = JSON.parse(readFileSync(join(project, lockPath), "utf8"));
  if (lock.repository !== repository || !/^[a-f0-9]{40}$/.test(lock.revision)) {
    throw new Error("Invalid course skill provenance");
  }
  const directory = join(project, skillPath);
  if (JSON.stringify(filesIn(directory)) !== JSON.stringify(Object.keys(lock.files).sort())) {
    throw new Error("Course skill files differ from the lock; run npm run skill:update -- <commit-sha>");
  }
  for (const [file, hash] of Object.entries(lock.files)) {
    if (digest(readFileSync(join(directory, file))) !== hash) {
      throw new Error(`Course skill changed locally: ${file}. Change upstream, then update the pin.`);
    }
  }
  return lock;
}

function updateCourseSkill(revision) {
  if (!/^[a-f0-9]{40}$/.test(revision ?? "")) {
    throw new Error("Usage: npm run skill:update -- <40-character commit SHA>");
  }
  const temporary = mkdtempSync(join(tmpdir(), "course-skill-"));
  try {
    const source = join(temporary, "source");
    mkdirSync(source);
    const git = (...args) => execFileSync("git", ["-C", source, ...args], { stdio: "pipe" });
    git("init", "--quiet");
    git("fetch", "--quiet", "--depth=1", `${repository}.git`, revision);
    git("checkout", "--quiet", "--detach", "FETCH_HEAD");
    if (git("rev-parse", "HEAD").toString().trim() !== revision) throw new Error("Upstream revision mismatch");
    const files = ["SKILL.md", "SPEC.md", "LICENSE", ...filesIn(join(source, "src")).map((file) => `src/${file}`)].sort();
    const staged = join(temporary, "skill");
    const hashes = {};
    for (const file of files) {
      const bytes = readFileSync(join(source, file));
      const target = join(staged, file);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, bytes);
      hashes[file] = digest(bytes);
    }
    // Prepare every file before replacing the existing install. No install hooks run.
    const destination = join(root, skillPath);
    mkdirSync(dirname(destination), { recursive: true });
    rmSync(destination, { recursive: true, force: true });
    cpSync(staged, destination, { recursive: true });
    writeFileSync(join(root, lockPath), JSON.stringify({ repository, revision, files: hashes }, null, 2) + "\n");
    checkCourseSkill();
    console.log(`Installed create-course from ${revision}. Review the diff, then run npm test, npm run lint, and npm run build.`);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === "--check") {
    console.log(`Course skill matches ${checkCourseSkill().revision}`);
  } else {
    updateCourseSkill(process.argv[2]);
  }
}
