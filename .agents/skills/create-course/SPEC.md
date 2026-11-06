# The course format

A course is a short series of exercises that a student's AI coding agent teaches them, one conversation at a time. It's plain Markdown, hosted wherever you like. Students start it by giving their agent its URL, for example "take the course at https://github.com/you/durable-objects-course".

This document is for course authors and for schools: the apps that track students' progress through courses. Schools can add their own rules on top, like a default interview or an API for reporting progress, but a course that follows this format should work in any of them.

## Where to host it

- A public git repo, for any course: `COURSE.md` at the root, and one Markdown file per exercise in `exercises/`. Students' agents clone it.
- A single Markdown file at any https URL, for a smaller course: a `COURSE.md` whose `##` sections are its exercises.

Private repos, and courses in a subdirectory of a repo, aren't supported yet.

## COURSE.md

```markdown title="COURSE.md"
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
- `metadata`: optional string keys and values. Two are defined:
  - `author`: who wrote the course, shown to students.
  - `url`: the course's canonical URL. Schools key students' progress by the course's URL, so set this if the course might move or get linked to in more than one way. Otherwise it's the URL the student gave their agent.
- `license` and `compatibility` (prerequisites: accounts, tools, or other courses, at most 500 characters): optional, as in an Agent Skill's `SKILL.md`.
- No other keys. Schools may reject unknown ones, so a typo fails loudly instead of being ignored.
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
- Frontmatter is optional: a one-line `description`, and `agent-instructions`, which only the student's agent reads. No other keys.

```markdown title="exercises/01-first-object.md"
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

The body is for the student and their agent alike. Schools may show it to students on the web as a preview, so keep anything only the agent needs in `agent-instructions`.

In a single file, each `##` section of `COURSE.md` is an exercise, in order. Its title is the heading's text and its slug is the heading's GitHub-style anchor, so `## Your first object` is `your-first-object`. There's no frontmatter per exercise, so address any notes for the agent in the section itself.

```markdown title="COURSE.md"
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
- Ask about the course's subject, not the student's general background. Schools usually ask that once, in their own interview, and share the answers with every course.
- Interviews aren't quizzed.

Leave it out and the school adds a default interview, usually one where the agent writes a few questions from your course's content.

## Make every exercise checkable

An exercise is complete when the student's agent says so, so give the agent something concrete to check first: fetch a deployed URL and compare the response, run a command and read its output, or look at a file the student changed. Say what the check is in `agent-instructions`, and say plainly that completion waits on it. Some schools also have the agent quiz the student after each exercise, written from the exercise itself.

## Involve the student

The student's agent does the work: it runs the commands, writes the code, and deploys. Left to itself, it will do the whole exercise in one go while the student watches, and the student finishes knowing that it works but not why. So point out the moments where the student should take part. Pick what fits each exercise; none of these are required:

- Let the student make the choices: a name, the text a page shows, what to store.
- Before a command runs, ask the student to predict what it will do.
- Have the agent show the key change (a config line, a handler) and wait for the student's OK before it ships.
- Ask a "what would change if…" question that applies the idea to a new case.
- Give the student something to try once it works: change it and redeploy, or store a few values of their own.

Tell the agent to wait for the student's reply at each of these moments, and put try-it steps before the check that completes the exercise. Agents mark an exercise complete and move on, so anything written after that gets skipped.

## Examples

[Cloudflare Dev School](https://github.com/agentschools/cfdev.school/tree/main/courses)'s built-in courses use this format:

- [Agent setup's COURSE.md](https://github.com/agentschools/cfdev.school/blob/main/courses/agent-setup/COURSE.md) and [its interview](https://github.com/agentschools/cfdev.school/blob/main/courses/agent-setup/exercises/00-interview.md)
- [The Workers course's COURSE.md](https://github.com/agentschools/cfdev.school/blob/main/courses/fundamentals/workers/COURSE.md) and ["Deploy a Worker"](https://github.com/agentschools/cfdev.school/blob/main/courses/fundamentals/workers/exercises/01-deploy-a-worker.md), which checks the deployed URL before completing
