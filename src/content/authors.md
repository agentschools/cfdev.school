---
description: "How to write a course for Cloudflare Dev School: what Dev School adds to the COURSE.md format, and a procedure for writing one with your agent."
agent-instructions: |
  You're helping a subject matter expert, the author, write a course for
  Cloudflare Dev School. Follow the create-course skill at
  https://raw.githubusercontent.com/agentschools/course-spec/main/skills/create-course/SKILL.md,
  step by step, with the Dev School specifics in the body below. Read the
  format at /course-spec.md on the site you fetched this guide from: it's
  the version this site accepts.

  - In step 1, every course can assume Dev School's Agent setup course as a
    prerequisite. Ask which other Dev School courses overlap with this one
    (GET /api/courses lists them).
  - In step 2, plan the personalization with the outline, as the body's
    "Personalize every exercise" and "Make it feel like one school"
    sections describe: what the interview asks, and what changes in each
    exercise because of each answer.
  - In step 4, write each exercise as the body's "Write exercises as
    tutorials" section describes, and check its facts as "Get the facts
    right" describes.
  - Before step 6, do what "Test it for real" describes.
  - In step 6, test the course by following /external-courses.md on the
    same site: use the author's student ID if they have one, or enroll a
    test student with POST /api/students, report the course, and work
    through every exercise until the course is complete.

  Don't promise features that aren't described here, in the format, or in
  /llms.txt.
---

# Writing a Cloudflare Dev School course

A course is a short series of exercises that a student's AI coding agent teaches them, one conversation at a time. Dev School courses use the [COURSE.md format](https://github.com/agentschools/course-spec), so a course you write here works in other schools that use it too. It's plain Markdown, hosted wherever you like. Students start it by telling their agent "take the course at" and its URL, and their progress counts on Cloudflare Dev School, the same as for the built-in courses.

The format is below. Dev School adds a few things to it:

- Every course can assume the student has done [Agent setup](/courses/agent-setup), so their agent knows Dev School and has the `cf` CLI.
- Don't ask in your interview what Agent setup's interview already covers: experience with AI agents, where the student has deployed before, what they want to build, and whether they want quizzes. Students' agents read those answers before every course.
- Leave the interview out and Dev School's [default interview](/default-interview.md) has the agent write two to four questions from your course's content.
- Students who opted in get a short quiz after each exercise, which their agent writes from the exercise.
- Dev School reads `metadata.author` and shows it to students.
- In `agent-instructions`, help the agent teach rather than just execute: give beginners a plain-language mental model of *why* a concept or feature exists before introducing jargon or running setup commands, build diagrams up progressively (redrawing the flow and adding one piece per exercise rather than showing a complex diagram all at once), make sure any Worker URL shared with the student responds usefully on `GET /` (either with an interactive test page or instructions on how to call its routes), keep features enabled while the student tries them or inspects the Cloudflare dashboard, and prefer non-blocking scenario or application prompts tailored to the student's interview goals over forced "say-it-back" checks.

## Personalize every exercise

Personalization is what makes a course here different from a tutorial on a web page, so plan for it from the start.

- If students will want different amounts of detail, ask how deep they want to go in your interview: the big picture with no code, how it works with the key settings, or hands-on with all the code. Ask about depth, not job titles: few students describe themselves the way your company does. You can give example roles as hints.
- Everyone builds the same thing; only the explanation changes. Say in your interview's `agent-instructions` what each level gets: what's shown (the code, the key config, or the dashboard), the words used, and the kind of check.
- Use every interview answer somewhere in the course, or don't ask the question.
- Repeat a one-line cue for each level in every exercise, since a later exercise may start in a fresh session that never read the interview's instructions.
- Students can change depth anytime by saying "less code" or "go deeper"; your levels should make that easy.

## Make it feel like one school

Students take several courses, so yours should pick up where theirs left off.

- Tell the agent which other courses overlap with yours, and in each exercise what to shorten for a student who's taken them.
- If students might bring an app from an earlier course, say how to add your feature alongside it (for example on its own path), and when to recommend a new app instead because the old one doesn't fit.
- Use the same names other courses and the Cloudflare docs use, and link each exercise to the next one.

## Write exercises as tutorials

Make each exercise's body a complete tutorial, with a default example: every step, every command, and the code. It's what a student reads on the web, and it gives the agent a consistent build. Keep `agent-instructions` to short cues on top: the choices to ask the student for, where to ask for a prediction, the check, and what to shorten. The agent substitutes the student's names and pitches the explanation to them.

- Keep anything the student works with across exercises (a lab page, an app) stable, so each exercise's change stays small.
- `COURSE.md` introduces the course. Don't repeat the exercise list in it: the course page already shows it.
- Let the student see the problem first, then fix it, and let them investigate instead of being shown an answer the agent set up.
- Be honest where a demo cuts corners, and don't contradict the course's own point in its code.

## Get the facts right

- The [Cloudflare docs](https://developers.cloudflare.com/) are the source of truth. Use their names for products and features, and check the CLI's too (`cf cli search`).
- Check every model against the [Workers AI changelog](https://developers.cloudflare.com/changelog/) for planned deprecations, and against the Workers Free plan if your course says Free works.
- Don't cite internal numbers without a public source, and don't have the agent work out prices itself: point students at the dashboard's own figures.

## Test it for real

Run the Cloudflare behavior your course depends on against a real account, on throwaway resources you delete afterward, before you write it into an exercise: docs and real behavior can disagree. Typecheck the code as it stands after each exercise, not only at the end. Then have someone else, or another model, review the course before you share it.

