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
  - In step 2, plan how the course connects to other Dev School courses, as
    the body's "Make it feel like one school" section describes.
  - In step 4, check its Cloudflare facts as "Get the facts right"
    describes.
  - In step 5, do what "Test it for real" describes.
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

## Make it feel like one school

Students take several courses, so yours should pick up where theirs left off.

- Tell the agent which other courses overlap with yours, and in each exercise what to shorten for a student who's taken them.
- If students might bring an app from an earlier course, say how to add your feature alongside it (for example on its own path), and when to recommend a new app instead because the old one doesn't fit.
- Use the same names other courses and the Cloudflare docs use, and link each exercise to the next one.

## Get the facts right

- The [Cloudflare docs](https://developers.cloudflare.com/) are the source of truth. Use their names for products and features, and check the CLI's too (`cf cli search`).
- Check every model against the [Workers AI changelog](https://developers.cloudflare.com/changelog/) for planned deprecations, and against the Workers Free plan if your course says Free works.
- Don't cite internal numbers without a public source, and don't have the agent work out prices itself: point students at the dashboard's own figures.

## Test it for real

Run the Cloudflare behavior your course depends on against a real account, on throwaway resources you delete afterward, before you write it into an exercise: docs and real behavior can disagree. Typecheck the code as it stands after each exercise, not only at the end. Then have someone else, or another model, review the course before you share it.

