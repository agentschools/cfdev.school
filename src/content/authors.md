---
description: "How to write a course for Cloudflare Dev School: the format, and a procedure for writing one with your agent."
agent-instructions: |
  You're helping a subject matter expert, the author, write a course for
  Cloudflare Dev School. Students take courses with their own AI coding
  agents: the student's agent reads the course's Markdown, teaches each
  exercise conversationally, and marks it complete once it has checked the
  student's work. The course format is in the body below. Work through
  these steps with the author, one at a time, checking in before moving on:

  1. Ask about the course, all at once and briefly: its topic, who it's
     for and what they already know, prerequisites (accounts, tools, or
     other courses; every course can assume Dev School's Agent setup
     course), and where they'll host it: a public git repo, or a single
     Markdown file at any https URL for a smaller course.
  2. Propose an outline: a title, a one-line description, and a handful
     of exercises in order, each teaching one thing and ending with
     something the student built or changed. Revise it with the author
     until they're happy with it.
  3. Scaffold the course: `COURSE.md` plus `exercises/` for a repo, or a
     single `COURSE.md` with a `##` section per exercise. Only add an
     interview if the course needs questions the default interview
     wouldn't think to ask.
  4. Write each exercise. The body is for the student; anything only the
     student's agent needs goes in `agent-instructions` (or, in a single
     file, in the section, addressed to the agent). Give every exercise a
     concrete check the student's agent can verify itself before marking
     it complete, and say plainly that completion waits on it. Mark the
     moments where the student takes part (see "Involve the student"),
     with any try-it steps before completion.
  5. Check the course against the rules in the body: `name` and every
     slug, filename order, a `#` title on every exercise file, and at most
     four interview questions.
  6. Test it by taking it as a student, once it's published at its https
     URL. Follow /external-courses.md on the site you fetched this guide
     from: use the author's student ID if they
     have one, or enroll a test student with POST /api/students, report
     the course, and work through every exercise until the course is
     complete. Fix anything that was unclear, or that the check couldn't
     verify, and tell the author what you changed.

  Don't promise features that aren't described here or in /llms.txt.
---

# Writing a Cloudflare Dev School course

A course is a short series of exercises that a student's AI coding agent teaches them, one conversation at a time. It's plain Markdown, hosted wherever you like. Students start it by telling their agent "take the course at" and its URL, and their progress counts on Cloudflare Dev School, the same as for the built-in courses.

## Where to host it

- A public git repo, for any course: `COURSE.md` at the root, and one Markdown file per exercise in `exercises/`. Students' agents clone it.
- A single Markdown file at any https URL, for a smaller course: a `COURSE.md` whose `##` sections are its exercises.

Private repos, and courses in a subdirectory of a repo, aren't supported yet.

## COURSE.md

```markdown
---
name: durable-objects
description: "Build stateful apps on Cloudflare with Durable Objects, for developers who've deployed a Worker."
metadata:
  author: Your name
  url: https://github.com/you/durable-objects-course
---

# Durable Objects

What the course covers and who it's for, in a paragraph or two.
```

- `name`: lowercase letters, numbers, and single hyphens, at most 64 characters.
- `description`: what the course teaches and who it's for, at most 1,024 characters.
- `metadata.author`: optional, shown to students.
- `metadata.url`: optional. Students' progress is keyed by the course's URL, so set this if the course might move or get linked to in more than one way. Otherwise it's the URL the student gave their agent.
- `license` and `compatibility` (prerequisites): optional, like in an Agent Skill's `SKILL.md`.
- Then a `# Title` and an introduction.

## Exercises

In a repo, each exercise is a file in `exercises/`:

```text
durable-objects-course/
├── COURSE.md
└── exercises/
    ├── 00-interview.md      optional
    ├── 01-first-object.md
    └── 02-websockets.md
```

- Order: natural filename order, so `2-alarms.md` comes before `10-cleanup.md`.
- Slug: the filename without `.md` or its number prefix, so `01-first-object.md` is `first-object`. Renumbering files to insert an exercise doesn't change slugs, so students keep their progress. Slugs follow the same rules as `name`.
- Title: the file's first `#` heading.
- Frontmatter is optional: a one-line `description`, and `agent-instructions`, which only the student's agent reads.

```markdown
---
description: "Create a Durable Object and call it from a Worker."
agent-instructions: |
  Help the student add a counter Durable Object to their Worker and
  deploy it. Before marking this exercise complete, fetch the deployed
  URL twice yourself and check the count went up.
---

# Your first object

What the student will build and why, written for the student.
```

In a single file, each `##` section of `COURSE.md` is an exercise, in order. Its title is the heading's text and its slug is the heading's GitHub-style anchor, so `## Your first object` is `your-first-object`. There's no frontmatter per exercise, so address any notes for the agent in the section itself.

```markdown
---
name: kv-in-ten-minutes
description: "Store and read data with Workers KV, for developers who've deployed a Worker."
---

# KV in ten minutes

An introduction.

## Create a namespace

...

## Read it back

...
```

## The interview

Every course starts with an interview, so the student's agent can pitch the course at the right level. To write your own, add an exercise with the slug `interview` (`00-interview.md`, or a `## Interview` section). It always comes first, whatever its filename.

- Ask at most four short questions. Claude Code's question tool takes four at a time.
- Write them as plain prose, like a list. There's no question format, only the agent reads them.
- Don't ask what Dev School's Agent setup interview already covers: experience with AI agents, where the student has deployed before, what they want to build, and whether they want quizzes.
- Interviews are never quizzed.

Leave it out and Dev School's default interview has the agent write two to four questions from your course's content.

## Make every exercise checkable

An exercise is complete when the student's agent says so, so give the agent something concrete to check first: fetch a deployed URL and compare the response, run a command and read its output, or look at a file the student changed. Say what the check is in `agent-instructions`. Students who opted in also get a short quiz after each exercise, which their agent writes from the exercise.

## Involve the student

The student's agent does the work: it runs the commands, writes the code, and deploys. Left to itself, it will do the whole exercise in one go while the student watches, and the student finishes knowing that it works but not why. So point out the moments where the student should take part. Pick what fits each exercise; none of these are required:

- Let the student make the choices: a name, the text a page shows, what to store.
- Before a command runs, ask the student to predict what it will do.
- Have the agent show the key change (a config line, a handler) and wait for the student's OK before it ships.
- Ask a "what would change if…" question that applies the idea to a new case.
- Give the student something to try once it works: change it and redeploy, or store a few values of their own.

Tell the agent to wait for the student's reply at each of these moments, and put try-it steps before the check that completes the exercise. Agents mark an exercise complete and move on, so anything written after that gets skipped.

## Examples

The built-in courses use the same format:

- [Agent setup's COURSE.md](/courses/agent-setup/COURSE.md) and [its interview](/courses/agent-setup/exercises/00-interview.md)
- [The Workers course's COURSE.md](/courses/workers/COURSE.md) and ["Deploy a Worker"](/courses/workers/exercises/01-deploy-a-worker.md), which checks the deployed URL before completing
