---
name: create-course
description: "Plan, write, and test a course in the COURSE.md format: a series of Markdown exercises that students' AI coding agents teach them. Use when someone wants to write, outline, scaffold, or review a course, lesson series, or tutorial for agent-driven learning."
license: MIT
metadata:
  url: https://github.com/agentschools/course-spec
---

# Create a course

You're helping a subject matter expert, the author, write a course. Students take courses with their own AI coding agents: the student's agent reads the course's Markdown, teaches each exercise conversationally, and marks it complete once it has checked the student's work.

Read [SPEC.md](SPEC.md) beside this skill first. It defines the file layouts, frontmatter, exercise ordering, stable slugs, interviews, and teaching requirements. Use this installed copy so the guidance agrees with the school's pinned version.

Read the target school or repository's author guide and contributor instructions too. Keep school-specific additions there: enrollment, progress reporting, quizzes, tracks, default interviews, catalog registration, media, and deployment are not part of the portable format. For a school hosted on the web, start with its `/llms.txt` and author guide.

Work with what the author has already supplied. Ask only for missing decisions that affect the course; revise the outline with them before writing the full course unless they have already approved one.

1. Establish the scope: its topic, who it's for and what they already know, prerequisites (accounts, tools, or other courses), which school or schools they'll offer it through, if any, and where they'll host it: a public git repo, or a single Markdown file at any https URL for a smaller course.
2. Propose an outline: a title, a one-line description, and a handful of exercises in order, each teaching one thing and ending with something the student built or changed. Revise it with the author until they're happy with it.
3. Scaffold the course: `COURSE.md` plus `exercises/` for a repo, or a single `COURSE.md` with a `##` section per exercise. Only add an interview if the course needs questions a default interview wouldn't think to ask.
4. Write each exercise. The body is for the student; anything only the student's agent needs goes in `agent-instructions` (or, in a single file, in the section, addressed to the agent). Give every exercise a concrete check the student's agent can verify itself before marking it complete, and say plainly that completion waits on it. Mark the moments where the student takes part (see "Involve the student" in the spec), with any try-it steps before completion.
5. Review the course using the checks below. Run the target repository's course validation, tests, and build when it has them. Fix failures before handing it over.
6. Test it by taking it as a student, once it's published at its https URL. If the author named a school, follow that school's instructions for taking a course by URL (fetch the school's `/llms.txt` if it has one), using a test enrollment unless the author has asked to record their own progress. Otherwise, take it yourself from its URL, reading only what a student's agent would, or ask the author to try it in a fresh agent session. Work through every exercise as a student would. Fix anything that was unclear, or that the check couldn't verify, and tell the author what you changed.

Don't promise features that aren't in the spec or in the school's own documentation.

## Write for learning

Keep each exercise focused on one observable outcome. Explain why the idea matters before commands or jargon, then let the student make a meaningful choice, prediction, or change. Tell the teaching agent where to wait for a reply, and put any try-it step before the completion check.

Verify product claims and commands against current official documentation and the actual tool version. Link the sources the student or teaching agent will need. Describe prerequisites, costs, accounts, and permissions that affect the exercise; don't assume a school will provision them. Use disposable examples when testing and report anything you couldn't walk through.

## Review before handing over

- Validate `COURSE.md` frontmatter against the allowed keys and limits in `SPEC.md`. For a repository course, keep its name consistent with the course directory and the school's conventions.
- Check unique course and exercise slugs. Preserve existing slugs when editing a published course so progress survives. Natural filename order determines repo exercises; the interview is first. For a single file, check every `##` heading's anchor, including duplicates and punctuation, against the slug rules.
- Check the first `#` heading in every exercise file and the course introduction. Keep teaching-agent notes in `agent-instructions` for repo courses, and student-facing explanations in the body.
- Include at most four short, subject-specific interview questions. Read the school's baseline interview before repeating background questions; omit a custom interview when the default is enough.
- Give every non-interview exercise a concrete check the teaching agent can perform and make completion depend on it. A command exiting successfully is enough only when that proves the intended result.
- Check links and the published layout. A portable repo course has `COURSE.md` at the root; a course inside a school's monorepo follows that school's registration and serving conventions instead.
- Separate automated validation from the student walkthrough. Report which paths, commands, and deployments were tested, and what remains unverified. Don't claim a course works end to end from a build alone.

## Resources for schools

[SPEC.md](SPEC.md) is the portable format reference, including examples of both layouts. The `src/` directory contains the matching TypeScript frontmatter schemas, ordering, slug, title, and interview rules, plus tests. Schools can vendor these alongside the skill to keep author guidance and runtime validation on the same revision. The source requires Zod 4; its tests use Vitest and YAML. These are implementation resources for school maintainers, not prerequisites for writing Markdown courses.
