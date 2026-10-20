import { readFileSync } from "node:fs";
import type { APIContext } from "astro";
import { describe, expect, it } from "vitest";
import { rawCourses } from "../lib/course-files";
import { GET as getExternalCourses } from "./external-courses.md";
import { GET } from "./llms.txt";

describe("GET /llms.txt", () => {
  it("serves plain text describing the real API surface", async () => {
    const response = await GET({} as APIContext);
    expect(response.headers.get("Content-Type")).toContain("text/plain");

    const text = await response.text();
    expect(text).toContain("Cloudflare Dev School");
    expect(text).toContain("POST /api/students");
    expect(text).toContain("GET /api/openapi.json");
    expect(text).toContain("GET /api/students/{id}/interviews");
    expect(text).toContain("PUT /api/students/{id}/interviews");
    expect(text).not.toMatch(/\/api\/students\/\{id\}\/interview\b/);
    expect(text).toContain("GET /api/harnesses/{harnessId}");
    expect(text).toContain("GET /api/courses");
    expect(text).toContain("GET /api/progress/{studentId}");
    expect(text).toContain("PUT /api/progress/{studentId}");
    expect(text).toContain("PUT /api/students/{id}/courses");
    expect(text).toContain("/default-interview.md");
    expect(text).not.toContain("aren't supported yet");
  });

  it("points agents at the course list instead of hardcoding exercise order", async () => {
    const text = await (await GET({} as APIContext)).text();
    expect(text).toContain("markdownUrl");
    expect(text).toContain("agent-setup");
    expect(text).not.toContain("/api/lessons");
    expect(text).not.toContain("/api/exercises");
  });

  it("links straight to Agent setup's interview file, which exists", async () => {
    const text = await (await GET({} as APIContext)).text();
    const match = text.match(/\/courses\/agent-setup\/exercises\/([\w-]+\.md)/);
    expect(match).not.toBeNull();
    const agentSetup = rawCourses().find((course) => course.name === "agent-setup");
    expect(Object.keys(agentSetup!.exercises)).toContain(match![1]);
  });

  it("moves the hosted-elsewhere procedure to /external-courses.md", async () => {
    const text = await (await GET({} as APIContext)).text();
    expect(text).toContain("/external-courses.md");
    expect(text).not.toContain("git clone");

    const response = await getExternalCourses({} as APIContext);
    expect(response.headers.get("Content-Type")).toContain("text/markdown");
    const procedure = await response.text();
    expect(procedure).toContain("PUT /api/students/{id}/courses");
    expect(procedure).toContain("git clone --depth 1");
  });

  it("tells agents to pause for the student and keep try-it steps before completion", async () => {
    const text = await (await GET({} as APIContext)).text();
    expect(text).toContain("## Involving the student");
    expect(text).toContain("pause dependent work and wait for their reply");
    expect(text).toContain("before you mark it complete");
  });

  it("keeps teaching an exercise whose setup is already done (#113)", async () => {
    const text = await (await GET({} as APIContext)).text();
    expect(text).toContain("Already set up isn't the same as already taught");
    expect(text).toContain(`"Where you'll use this" section, cover it before you mark the exercise complete`);
    expect(text).toContain("don't say a later exercise will use something unless the section says it does");
  });

  it("describes the tracks and the fork after Agent setup", async () => {
    const text = await (await GET({} as APIContext)).text();
    expect(text).toContain("`projects`");
    expect(text).toContain("`fundamentals`");
    expect(text).toContain("use their recorded Agent setup interview");
    expect(text).toContain("explicitly invite them to return to it");
    expect(text).toContain("work on that project with you, take a guided project course from the catalog, or study related fundamentals");
    expect(text).toContain("If they didn't name a project");
    expect(text).toContain("only suggest courses GET /api/courses lists");
    expect(text).toContain("don't save this choice anywhere");
  });
  it("offers the original project and catalog alternatives in the last setup exercise", () => {
    const tools = readFileSync(new URL("../../courses/agent-setup/exercises/05-tools.md", import.meta.url), "utf8");
    const next = tools.split("## What's next")[1];
    expect(next).toContain("return to the project you described in your interview");
    expect(next).toContain("work on it together");
    expect(next).toContain("guided project course or related fundamentals");
    expect(next).toContain("[courses](/courses)");
  });
});
