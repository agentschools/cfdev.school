---
description: "Tell your agent a bit about yourself so it can tailor the course to you."
agent-instructions: |
  This is the first exercise of the Agent setup course: a short
  interview. Ask all the questions at once, not one at a time, so the
  student only waits on you once. Keep every question to one short line
  with short answer choices, so the student can answer quickly.

  Before asking anything, GET /api/students/{id}/interview. If the student
  already has answers on file (a 404 means they don't), only ask the
  questions they haven't answered yet, and show them what's on file.

  How to ask:

  - If you have a structured question tool that takes several separate
    questions in one call (e.g. Claude Code's `AskUserQuestion`,
    OpenCode's `question`, Codex's `request_user_input` in Plan mode), put
    all the questions in one call, each as its own question with its own
    choices. The tool shows them to the student one at a time, each with
    a type-your-own option, and returns all the answers together, so
    there's no wait on you between questions. Don't split them across
    separate turns. If the tool caps how many questions fit in one call,
    use as few calls as possible.
  - Never merge questions into one, and never offer combined answers that
    cover several questions at once (e.g. "Beginner, no quizzes"). If your
    tool only takes one question per call, don't use it for this
    interview: use the plain-text message below instead.
  - Otherwise, ask them all in one numbered plain-text message, and tell
    the student they can answer in one reply, e.g. "1b, 2a, 3: a todo app,
    4 yes".
  - Either way, show the student only the questions and choices below, in
    plain words. Don't include field names, their student ID, or notes
    about what you need.

  The questions (every one is optional, if the student skips one, move on
  without pushing):

  1. "How much have you used AI coding agents like this one?" Choices:
     this is my first time / now and then / daily. Store as
     `agentExperience`: "new", "occasional", or "daily".
  2. "Where have you deployed apps before? (pick any)" Choices, multiple
     allowed: nowhere yet / Vercel or Netlify / AWS, Google Cloud, or
     Azure / Cloudflare. Store as `platformsUsed`, an array of the
     platform names they picked or typed (e.g. `["Vercel", "AWS"]`), or
     `[]` for nowhere yet.
  3. "What do you want to build or learn?" Free text, one line is plenty.
     Store as `learningGoals` in their words, lightly trimmed.
  4. "Want a short quiz at the end of each exercise? (recommended,
     skippable anytime)" Choices: yes / no. Store as `quizOptIn`.

  Use the first two answers only to adjust your tone, depth, and
  comparisons in later exercises (e.g. explain a Worker by comparison to a
  Vercel function for someone who's used Vercel), never to skip exercises
  or change what content you show.

  Don't ask about things you can check yourself:

  - Detect their operating system (e.g. run `uname`, or check an OS
    environment variable), store it as `os` ("macos", "linux", "windows",
    or "other"), and mention what you found.
  - Check whether Node.js (`node --version`) and the `cf` CLI
    (`cf --version`) are installed, whether `cf auth whoami` reports them
    as logged in, and whether they already have a global instructions file
    for you. Mention what you found in a sentence and use it to pace the
    setup exercises that follow. Don't store these, and don't install or
    change anything yet.

  Store the answers with PUT /api/students/{id}/interview. It's a partial
  update, so send only the fields you're setting; one call with all of
  them is fine.

  Then, in two or three sentences: summarize what you'll do with their
  answers (how you'll pitch explanations, whether you'll quiz them), and
  tell them plainly that they can change any of it at any time just by
  telling you, e.g. "turn off quizzes" or "I use AI agents more than I
  said". Whenever a student asks to change an answer, in this exercise or
  any later one, PUT just that field, then re-send this exercise's
  completion (below, same `harness`) with an updated `summary`, and adjust
  from then on.

  Finally, mark this exercise complete with PUT /api/progress/{studentId}
  as /llms.txt describes, including a `summary`: one sentence addressed
  to the student covering their saved answers, e.g. "You're new to AI
  agents, haven't deployed anything before, are on macOS, want to build a
  link shortener, and opted into quizzes." Their homepage shows it to
  confirm the answers were saved. Then move on to the next exercise,
  "models". There's no quiz for this exercise.
---

# Interview

In this exercise, your agent asks you a few quick questions so it can tailor the rest of the course to you: how much it explains, which examples it reaches for, and what it compares new ideas to.

Your agent asks all the questions at once, and each one takes a few words to answer. Every question is optional. Skip any you'd rather not answer.

## What gets saved

This is saved with your student ID so your agent can pick up where you left off in later exercises:

- How much you've used AI coding agents
- Where you've deployed apps before, if anywhere
- What you want to build or learn, in your own words
- Whether you want a short quiz at the end of each exercise
- Your operating system, which your agent detects by itself so it can give you the right commands
- Which exercises you've completed
- Which agent you used for each exercise, like Claude Code or Codex
- Which model your agent was running, when it reports one

Your agent also checks whether a few tools it needs are installed, like Node.js and the `cf` CLI. That isn't saved.

## No personal information

Cloudflare Dev School doesn't have accounts. Your student ID is a random name like `smooth-operator-4629`, not your name or email, and nothing above asks who you are. The one free-text answer, what you want to build, is the only place personal details could end up, so keep it about the project.

To clear your progress, or to forget your student ID in this browser, use the [Disenroll](/disenroll) page.

## Changing your answers

You can change any answer at any time, in any exercise, just by telling your agent. For example: "turn off quizzes," "I've used AWS before, too," or "I want to focus on building APIs now." Nothing you say here locks you in.

Early in the course, your agent may ask for permission before running commands or making web requests. Approving those prompts is normal here: it needs to reach this site's API to save your answers and track your progress.
