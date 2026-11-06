/**
 * Ordering, slug, and title rules from SPEC.md. Frontmatter shapes live in
 * src/schemas.ts. No framework dependencies, so any school can load courses
 * with them.
 */

export const INTERVIEW_SLUG = "interview";

/** "03-first-object.md" is "first-object": renumbering files doesn't change slugs. */
export function exerciseSlugFromFilename(filename: string): string {
  return filename.replace(/\.md$/, "").replace(/^\d+[-_]/, "");
}

/** Natural filename order, so "2-x.md" sorts before "10-y.md". */
export function compareExerciseFilenames(a: string, b: string): number {
  return a.localeCompare(b, "en", { numeric: true });
}

/** The first `# ` heading outside a fenced code block, if any. */
export function titleFromMarkdown(markdown: string): string | undefined {
  let fence: string | undefined;
  for (const line of markdown.split("\n")) {
    const marker = line.match(/^\s*(```|~~~)/)?.[1];
    if (marker) {
      if (!fence) fence = marker;
      else if (marker === fence) fence = undefined;
      continue;
    }
    const heading = !fence && line.match(/^#\s+(.+?)\s*#*\s*$/);
    if (heading) return heading[1];
  }
  return undefined;
}

/** Puts the interview first, adding `implicitInterview()` when the course doesn't have one. */
export function withInterviewFirst<T extends { slug: string }>(exercises: readonly T[], implicitInterview: () => T): T[] {
  const interview = exercises.find((exercise) => exercise.slug === INTERVIEW_SLUG);
  return [interview ?? implicitInterview(), ...exercises.filter((exercise) => exercise !== interview)];
}
