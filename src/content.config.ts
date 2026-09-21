import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";
import { harnessProfileSchema } from "./data/harnesses";

/**
 * One entry per (lesson, harness) pair, e.g. `models/claude-code.md`. The
 * "generic" harness id is the fallback used when a student's harness has no
 * dedicated variant, or when no harness is known yet (see
 * src/lib/lesson-client.ts and src/pages/api/lessons/[slug].ts).
 */
const lessons = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "src/content/lessons" }),
  schema: z.object({
    lessonSlug: z.string(),
    harness: harnessProfileSchema.shape.id,
    title: z.string(),
    description: z.string(),
    order: z.number(),
    quiz: z.boolean().default(true),
    /** Instructions the agent follows to teach this lesson, not shown to the student directly. */
    agentInstructions: z.string(),
  }),
});

export const collections = { lessons };
