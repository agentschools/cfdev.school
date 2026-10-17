import type { APIContext } from "astro";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import { GET } from "../pages/llms.txt";
import { rawCourses } from "./course-files";

// These are curriculum regression tests, not a harness security boundary.
// Only repository content is loaded; no credential files or real secrets.
const courses = rawCourses();

function instructions(file: string, courseName = "agent-setup"): string {
  const markdown = courses.find((course) => course.name === courseName)!.exercises[file];
  const frontmatter = markdown.match(/^---\n([\s\S]*?)\n---\n/)![1];
  const parsed = parseYaml(frontmatter) as { "agent-instructions": string };
  return parsed["agent-instructions"].replace(/\s+/g, " ");
}

describe("credential safety guidance (#133)", () => {
  it("serves the credential-file prohibition before agents start setup", async () => {
    const text = await (await GET({} as APIContext)).text();
    const section = text.split("## Protect credentials\n")[1]?.split("\n## ")[0];
    expect(section).toBeDefined();
    expect(text.indexOf("## Protect credentials")).toBeLessThan(text.indexOf("## Starting fast"));
    expect(section).toContain("Never read, print, or copy credential files or secret values");
    expect(section).toContain("even with your own redaction");
    for (const example of ["~/.local/share/opencode/auth.json", "~/.codex/auth.json", "Claude Code's stored credentials", ".env", ".npmrc"]) {
      expect(section).toContain(example);
    }
    expect(section).toContain("Don't dump environment variables");
  });

  it("offers safe discovery and handles unavailable commands and mixed config", async () => {
    const text = await (await GET({} as APIContext)).text();
    expect(text).toContain("list/status command that does not return secrets");
    expect(text).toContain("opencode auth list");
    expect(text).toContain("opencode models");
    expect(text).toContain("If a safe command isn't available or fails, ask the student");
    expect(text).toContain("Never ask them to paste credentials into chat");
    expect(text).toContain("have the student make that edit themselves instead of reading the file");
    expect(text).toContain("don't recursively search their parent config directories");
  });

  it("does not treat later redaction as recovery from an accidental exposure", async () => {
    const text = await (await GET({} as APIContext)).text();
    expect(text).toContain("without repeating or saving it elsewhere");
    expect(text).toContain("revoking or rotating the exposed credential through its provider");
    expect(text).toContain("redacting a later message does not undo the earlier exposure");
  });

  it("replaces open-ended model/provider discovery with non-secret sources", () => {
    const text = instructions("01-models.md");
    expect(text).not.toContain("check what's configured");
    expect(text).toContain("Never open credential files");
    expect(text).toContain("even with a script that tries to redact secrets");
    expect(text).toContain("documented provider/model list commands that do not return secrets");
    expect(text).toContain("ask the student for provider/model names, not tokens or configuration dumps");
    expect(text).toContain("This exercise has no file-system verification step");
  });

  it.each(["03-cli.md", "05-tools.md"])("keeps %s sign-in troubleshooting out of credential files", (file) => {
    const text = instructions(file);
    expect(text).toContain("Never open credential files");
    if (file === "03-cli.md") {
      expect(text).toContain("cf auth whoami");
      expect(text).toContain("even to debug a failed login");
    } else {
      expect(text).toContain("documented status command that does not return secrets");
      expect(text).toContain("If that config could contain secrets");
      expect(text).toContain("never in chat or in a command you capture");
    }
  });

  it("keeps skill discovery scoped to install/list output or skill files", () => {
    const text = instructions("04-skills.md");
    expect(text).toContain("Use the install/list output or specific skill files");
    expect(text).toContain("don't recursively search agent config directories or open credential files");
  });

  it("troubleshoots remote bindings without dumping Cloudflare credentials", () => {
    const text = instructions("02-call-another-worker.md", "bindings");
    expect(text).not.toContain("env | grep CLOUDFLARE_");
    expect(text).toContain("env -u CLOUDFLARE_API_TOKEN -u CLOUDFLARE_API_KEY -u CLOUDFLARE_ACCOUNT_ID cf dev");
    expect(text).toContain("Don't print environment variables or open credential files");
  });

  it("has the student enter a webhook secret outside the conversation", () => {
    const text = instructions("04-get-notified.md", "build-a-guestbook");
    expect(text).not.toContain("They paste the URL to you");
    expect(text).toContain("Never ask them to paste the URL into chat");
    expect(text).toContain("outside the agent's tool output");
    expect(text).toContain("Don't read the file or echo the value back");
    expect(text).toContain("verify through the notification arriving");
  });
});
