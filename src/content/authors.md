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
    prerequisite.
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
- Follow /llms.txt's "Asking and answering questions" policy for interview questions: students' agents choose how to present them, so don't prescribe a harness or question UI.
- Leave the interview out and Dev School's [default interview](/default-interview.md) has the agent write two to four questions from your course's content.
- Students who opted in get a short quiz after each exercise, which their agent writes from the exercise.
- Dev School reads `metadata.author` and shows it to students.

