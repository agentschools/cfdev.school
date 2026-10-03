import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";
import { exerciseSlugSchema } from "./schemas/exercise";

/**
 * One entry per lesson, e.g. `models.md`. Lessons are written for any agent;
 * harness-specific facts (file paths, commands, billing) live in
 * src/data/harnesses.ts, served to agents by GET /api/harnesses/{id}.
 */
const lessons = defineCollection({
  loader: glob({ pattern: "*.md", base: "src/content/lessons" }),
  schema: z.object({
    lessonSlug: z.string(),
    title: z.string(),
    description: z.string(),
    order: z.number(),
    quiz: z.boolean().default(true),
    /** Instructions the agent follows to teach this lesson, not shown to the student directly. */
    agentInstructions: z.string(),
  }),
});

/**
 * Short student-facing page prose for each exercise (intro, what you'll build,
 * prerequisites). Title/description/order and the agent-facing walkthrough live
 * in src/data/exercises.ts — this collection only holds what the /exercises/{slug}
 * page renders.
 */
const exercises = defineCollection({
  loader: glob({ pattern: "*.md", base: "src/content/exercises" }),
  schema: z.object({
    exerciseSlug: exerciseSlugSchema,
  }),
});

export const collections = { lessons, exercises };
