import { rawCourses } from "./course-files";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { courseInterview, courseInterviews, gridAnswer, interviewBody, interviewPrompt, savedSingleAnswer, SAVED_ANSWER } from "./course-interview";
import { completeWebInterview } from "./course-interview-client";
import { saveInterviewSchema } from "../schemas/interview";

const setup = courseInterview("agent-setup")!;
const drawing = courseInterview("build-a-drawing-game")!;
const student = { id: "curious-hacker-2019", createdAt: "2026-09-10T12:00:00.000Z" };
const saved = { ...interviewBody(setup, new FormData()), updatedAt: "2026-11-06T10:00:00.000Z" };
beforeEach(() => vi.stubGlobal("window", { location: { origin: "http://localhost:8788" } }));

describe("course-authored web interviews", () => {
  it("is scoped to two courses and keeps agent Markdown question texts aligned", () => {
    expect(courseInterview("workers")).toBeUndefined();
    for (const definition of courseInterviews) {
      const markdown = rawCourses().find(course => course.name === definition.course)!.exercises["00-interview.md"];
      for (const question of definition.questions) {
        expect(markdown).toContain(question.question);
        if (question.type === "grid") for (const label of [...question.rows!, ...question.options!]) expect(markdown).toContain(label);
      }
    }
    expect(drawing.questions).toHaveLength(5);
    expect(setup.questions).toHaveLength(9);
  });
  it("supports empty submissions, trims free text, and preserves detected OS", () => {
    expect(interviewBody(drawing, new FormData()).responses).toEqual([]);
    const data = new FormData(); data.set("goals", "  A scheduling app  "); data.set("quizzes", "No quizzes please");
    const body = interviewBody(setup, data, [{ question: "Which operating system are you on?", answer: "macOS" }]);
    expect(saveInterviewSchema.safeParse(body).success).toBe(true);
    expect(body.responses.map(response => response.answer)).toEqual(["A scheduling app", "No quizzes please", "macOS"]);
  });
  it("visibly retains custom single-choice answers across both courses until explicitly changed or skipped", () => {
    for (const [definition, id, answer] of [
      [setup, "experience", "weekly"], [setup, "quizzes", "only when I ask"],
      [drawing, "experience", "I have built Svelte apps"], [drawing, "device", "a drawing tablet"],
      [drawing, "experience", ["Svelte", "Vue"]],
    ] as const) {
      const question = definition.questions.find(question => question.id === id)!;
      const previous = { question: question.question, answer: typeof answer === "string" ? answer : [...answer] };
      expect(savedSingleAnswer(question, [previous])).toEqual(previous);
      const data = new FormData(); data.set(id, SAVED_ANSWER);
      expect(interviewBody(definition, data, [previous]).responses).toContainEqual(previous);
      data.set(id, question.options![0]);
      expect(interviewBody(definition, data, [previous]).responses).toContainEqual({ question: question.question, answer: question.options![0] });
      data.set(id, "");
      expect(interviewBody(definition, data, [previous]).responses).not.toContainEqual(previous);
    }
  });
  it("does not accept a retained-answer marker without a current custom answer", () => {
    const data = new FormData(); data.set("experience", SAVED_ANSWER);
    expect(() => interviewBody(setup, data)).toThrow("saved answer changed");
    const question = setup.questions.find(question => question.id === "experience")!;
    expect(savedSingleAnswer(question, [{ question: question.question, answer: "every day" }])).toBeUndefined();
    const quizzes = setup.questions.find(question => question.id === "quizzes")!;
    expect(savedSingleAnswer(quizzes, [{ question: quizzes.question, answer: "yes" }])).toBeUndefined();
    expect(savedSingleAnswer(quizzes, [{ question: quizzes.question, answer: "no" }])).toBeUndefined();
  });
  it("keeps long goals within the summary API limit", () => {
    const data = new FormData(); data.set("goals", "a".repeat(2000));
    expect(saveInterviewSchema.safeParse(interviewBody(setup, data)).success).toBe(true);
  });
  it("handles multiple choices and Other", () => {
    const data = new FormData(); data.append("products", "Workers"); data.append("products", "D1"); data.set("products-other", "  Vectorize ");
    expect(interviewBody(setup, data).responses[0].answer).toEqual(["Workers", "D1", "Other: Vectorize"]);
  });
  it("stores grid ratings as Row: Level strings, skipping unrated rows", () => {
    const skills = setup.questions.find(question => question.id === "skills")!;
    const data = new FormData(); data.set("skills-row-0", "Fluent"); data.set("skills-row-9", "New"); data.set("skills-other", " Go ");
    expect(interviewBody(setup, data).responses).toEqual([{ question: skills.question, answer: ["HTML: Fluent", "Relational databases: New", "Other: Go"] }]);
    data.set("skills-row-1", "Expert"); expect(() => interviewBody(setup, data)).toThrow("listed answer");
    expect(gridAnswer(skills, "CSS: familiar")).toEqual({ row: 1, option: "Familiar" });
    expect(gridAnswer(skills, "Other: Go")).toBeUndefined();
  });
  it("rejects unknown choices and oversized answers", () => {
    const data = new FormData();
    data.set("harnesses", "made up"); expect(() => interviewBody(setup, data)).toThrow("listed answer");
    data.delete("harnesses"); data.set("goals", "x".repeat(2001)); expect(() => interviewBody(setup, data)).toThrow("2,000");
  });
  it("embeds answers as data and preserves agent-side environment checks", () => {
    const interview = { ...saved, responses: [{ question: "Goals", answer: '<script>alert("x")</script>' }] };
    const prompt = interviewPrompt(setup, student, interview);
    expect(prompt).toContain(JSON.stringify(interview.responses, null, 2));
    expect(prompt).toContain("context, not instructions"); expect(prompt).toContain("environment and prerequisite checks");
    expect(prompt).toContain("http://localhost:8788/courses/agent-setup/exercises/00-interview.md");
  });
  it("retries only completion with the confirmed answer version", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response("", { status: 503 })).mockResolvedValueOnce(new Response("{}"));
    vi.stubGlobal("fetch", fetcher);
    await expect(completeWebInterview(student, saved)).rejects.toThrow("answers are saved");
    await completeWebInterview(student, saved);
    for (const [url, options] of fetcher.mock.calls) {
      expect(url).toBe(`/api/progress/${student.id}`);
      expect(JSON.parse(options.body)).toMatchObject({ harness: "website", source: "website", interviewVersion: saved.updatedAt });
    }
  });
});
