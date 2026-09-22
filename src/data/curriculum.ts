/**
 * The full five-lesson curriculum outline (see plan.agent.md's Lessons
 * section), in display order. Not every lesson has content yet; the
 * sidebar (src/components/CurriculumSidebar.astro) cross-references this
 * list against the "lessons" content collection to decide which entries
 * are linkable versus shown as coming soon.
 */
export const LESSON_OUTLINE: readonly { slug: string; title: string }[] = [
  { slug: "models", title: "Models" },
  { slug: "instructions", title: "Instructions" },
  { slug: "cli", title: "CLI" },
  { slug: "skills", title: "Skills" },
  { slug: "tools", title: "Tools" },
];
