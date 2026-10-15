---
description: "Personalize your learning experience by sharing a bit about your existing knowledge, your goals, and your preferred style of learning."
agent-instructions: |
  This is the first exercise of the Agent setup course: a short
  interview. Ask all the questions at once, not one at a time, so the
  student only waits on you once. Keep every question to one short line
  with short answer choices, so the student can answer quickly. Get the
  questions in front of the student as fast as you can: don't run any
  checks or fetch anything else first, and don't write a preamble.

  Before asking anything, GET /api/students/{id}/interviews (fetch it
  alongside this file if you can). If Agent setup's interview is already
  on file, show the student what's there and only ask the questions it
  doesn't answer yet.

  Ask them all in one numbered plain-text chat message, not a question
  tool or picker, and tell the student they can answer in one reply,
  e.g. "1b, 2a, 3: a todo app, 4 yes". Show only the questions and
  choices below, in plain words. Don't include field names, their student
  ID, or notes about what you need.

  The questions (every one is optional, if the student skips one, move on
  without pushing):

  1. "How much have you used AI coding agents like this one?" Choices:
     this is my first time / now and then / daily.
  2. "Where have you deployed apps before? (pick any)" Choices, multiple
     allowed: nowhere yet / Vercel or Netlify / AWS, Google Cloud, or
     Azure / Cloudflare.
  3. "What do you want to build or learn?" Free text, one line is plenty.
  4. "Want a short quiz at the end of each exercise? (recommended,
     skippable anytime)" Choices: yes / no.

  Use the first two answers only to adjust your tone, depth, and
  comparisons in later exercises (e.g. explain a Worker by comparison to a
  Vercel function for someone who's used Vercel), never to skip exercises
  or change what content you show.

  Don't ask about things you can check yourself. Run these checks after
  the questions are out, never before asking: right after sending them if
  you can keep working in the same turn, otherwise once the student
  replies.

  - Detect their operating system (e.g. run `uname`, or check an OS
    environment variable).
  - Check whether Node.js (`node --version`) and the `cf` CLI
    (`cf --version`) are installed, whether `cf auth whoami` reports them
    as logged in, and whether they already have a global instructions file
    for you.

  Mention what you found in a sentence once you have the answers, and use
  it to pace the setup exercises that follow. Don't store these (except
  the OS, below), and don't install or change anything yet.

  Store the answers with PUT /api/students/{id}/interviews, with
  `"course": "agent-setup"`. Each response's `question` is the question's
  text exactly as written above, so later agents recognize it, and its
  `answer` is the choice the student picked, an array of the choices they
  picked (or typed) for question 2, or their own words for question 3,
  lightly trimmed. Leave out questions they skipped. Store the OS you
  detected as a pair too, with the question "Which operating system are
  you on?" and an answer like "macOS", "Linux", or "Windows". Include a
  `summary`: one sentence addressed to the student covering their
  answers. Their homepage shows it to confirm the answers were saved. For
  example:

  ```json
  {
    "course": "agent-setup",
    "responses": [
      { "question": "How much have you used AI coding agents like this one?", "answer": "this is my first time" },
      { "question": "Where have you deployed apps before? (pick any)", "answer": ["nowhere yet"] },
      { "question": "What do you want to build or learn?", "answer": "a link shortener" },
      { "question": "Want a short quiz at the end of each exercise? (recommended, skippable anytime)", "answer": "yes" },
      { "question": "Which operating system are you on?", "answer": "macOS" }
    ],
    "summary": "You're new to AI agents, haven't deployed anything before, are on macOS, want to build a link shortener, and opted into quizzes."
  }
  ```

  Then, in two or three sentences: summarize what you'll do with their
  answers (how you'll pitch explanations, whether you'll quiz them), and
  tell them plainly that they can change any of it at any time just by
  telling you, e.g. "turn off quizzes" or "I use AI agents more than I
  said". Whenever a student asks to change an answer, in this exercise or
  any later one, PUT this interview again with that answer changed and an
  updated `summary`, and adjust from then on. PUT replaces the whole
  interview, so send every response, not just the one that changed.

  Finally, mark this exercise complete with PUT /api/progress/{studentId}
  as /llms.txt describes. Then move on to the next exercise, "models".
  There's no quiz for this exercise.
---

# Interview

In this exercise, your agent asks you a few quick questions so it can tailor the rest of the course to you: how much it explains, which examples it reaches for, and what it compares new ideas to.

Your agent asks all the questions at once, and each one takes a few words to answer. Every question is optional. Skip any you'd rather not answer.

## What happens next

Answer the questions in your coding-agent app. Your agent also runs read-only checks for your operating system, installed tools, Cloudflare login status, and an existing instructions file. These checks don't install tools or change your setup.

Depending on your app and its permissions, you may see prompts to allow commands or web requests. Read what each prompt allows before approving it. Your agent needs access to this site's API to save your answers and mark the interview complete; if that access is waiting for permission, the save is still pending. Once saving succeeds, your homepage shows a summary of your answers and the interview is marked complete. Then you'll continue to Models.

## What gets saved

This is saved with your student ID so your agent can pick up where you left off in later exercises:

- How much you've used AI coding agents
- Where you've deployed apps before, if anywhere
- What you want to build or learn, in your own words
- Whether you want a short quiz at the end of each exercise
- Your operating system, which your agent detects by itself so it can give you the right commands
- A one-sentence summary of your answers, written by your agent and shown on the homepage
- Which exercises you've completed
- Which agent you used for each exercise, like Claude Code or Codex
- Which model your agent was running, when it reports one

Your agent also checks whether a few tools it needs are installed, like Node.js and the `cf` CLI. That isn't saved.

## No personal information

Cloudflare Dev School doesn't have accounts. Your student ID is a random name like `smooth-operator-4629`, not your name or email, and nothing above asks who you are. The one free-text answer, what you want to build, is the only place personal details could end up, so keep it about the project.

To clear your progress, or to forget your student ID in this browser, use the [Disenroll](/disenroll) page.

## Changing your answers

You can change any answer at any time, in any exercise, just by telling your agent. For example: "turn off quizzes," "I've used AWS before, too," or "I want to focus on building APIs now." Nothing you say here locks you in.
