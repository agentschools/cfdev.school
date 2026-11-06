---
description: "Personalize your learning experience by sharing a bit about your existing knowledge, your goals, and your preferred style of learning."
agent-instructions: |
  If the student used the website form, do not re-ask its questions or
  questions they left blank. Read their saved answers, then run
  the read-only environment checks below even if progress says this
  interview is complete. Store the detected OS alongside all saved
  responses without dropping the website's extra context. Continue to
  Models after explaining what you found.

  This is the first exercise of the Agent setup course: a short
  interview. Ask all the questions at once, not one at a time, so the
  student only waits on you once. Keep every question to one short line
  with short answer choices, so the student can answer quickly. Get the
  questions in front of the student as fast as you can: don't run any
  checks or fetch anything else first, and don't write a preamble.

  Before asking anything, GET /api/students/{id}/interviews (fetch it
  alongside this file if you can). If Agent setup's interview is already
  on file, show the student what's there and ask only whether they'd like
  to change anything. Don't repeat skipped questions.

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

  1. "How much have you used AI coding agents?" Choices: Not yet / A few times / Most weeks / Every day.
  2. "Which AI apps and agent harnesses have you used?" Choose any: Claude Code / Claude desktop / ChatGPT / Codex / Pi / OpenCode / Cursor / GitHub Copilot / Gemini CLI / Other (their own words).
  3. "Where have you deployed apps before?" Choose any: Vercel / Netlify / Heroku / AWS / Google Cloud / Azure / Cloudflare / Other (their own words).
  4. "Which Cloudflare products have you used before?" Choose any: Workers / R2 / D1 / Workers KV / Durable Objects / AI Gateway / Queues / Browser Run / Workflows / Containers / Vectorize / Other (their own words).
  5. "What are you interested in building on Cloudflare?" Choose any: Web apps / Cloud agents / Automations / APIs and backends / Games / Data tools / Multiplayer apps / MCP servers / Browser automation / Other (their own words).
  6. "What do you want to build or learn?" Free text. Tell us about your idea, who it is for, and what you hope to learn. More context helps your agent connect the course to what you want to build.
  7. "How do you like to learn?" Free text. For example: explain each step, let me try first, use diagrams, or compare with tools I know. More context helps your agent tailor the pace and explanations.
  8. "Want a short quiz at the end of each exercise?" Choices: Yes, quiz me! / No quizzes please. Default to "Yes, quiz me!" if they skip it.

  Use their experience, product, app, and learning preferences to adjust tone, depth, and
  comparisons in later exercises (e.g. explain a Worker by comparison to a
  Vercel function for someone who's used Vercel), never to skip exercises
  or change what content you show.

  Don't ask about things you can check yourself. Check them while the
  student answers: if you're asking with a structured question tool and
  can run other tools in the same batch, run these checks alongside it;
  otherwise, run them right after the student replies. Never run them
  before asking.

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
  `answer` is a string for single choices or free text, or an array for
  multiple selections. Include Other as "Other: their words". Store quiz
  answers as "Yes, quiz me!" or "No quizzes please". Free text is lightly trimmed. Leave out questions they skipped. Store the OS you
  detected as a pair too, with the question "Which operating system are
  you on?" and an answer like "macOS", "Linux", or "Windows". Include a
  `summary`: one sentence addressed to the student covering their
  answers. Their homepage shows it to confirm the answers were saved. For
  example:

  ```json
  {
    "course": "agent-setup",
    "responses": [
      { "question": "How much have you used AI coding agents?", "answer": "Not yet" },
      { "question": "Where have you deployed apps before?", "answer": ["Vercel"] },
      { "question": "What do you want to build or learn?", "answer": "a link shortener" },
      { "question": "Want a short quiz at the end of each exercise?", "answer": "Yes, quiz me!" },
      { "question": "Which operating system are you on?", "answer": "macOS" }
    ],
    "summary": "You're new to AI agents, have deployed to Vercel before, are on macOS, want to build a link shortener, and opted into quizzes."
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

Answer the form on this page, or take the interview with your agent, to tailor the rest of the course to you: how much it explains, which examples it reaches for, and what it compares new ideas to.

Quick selections cover your experience and interests, with room to describe your goals and learning preferences. More context helps your agent personalize the course. Every question is optional. Skip any you'd rather not answer.

## What happens next

If you choose the agent interview, answer in your coding-agent app. If you use the website, copy the personalized prompt after submission. Your agent also runs read-only checks for your operating system, installed tools, Cloudflare login status, and an existing instructions file. These checks don't install tools or change your setup.

Depending on your app and its permissions, you may see prompts to allow commands or web requests. Read what each prompt allows before approving it. Your agent needs access to this site's API to save your answers and mark the interview complete; if that access is waiting for permission, the save is still pending. Once saving succeeds, your homepage shows a summary of your answers and the interview is marked complete. Then you'll continue to Models.

## What gets saved

This is saved with your student ID so your agent can pick up where you left off in later exercises:

- How much you've used AI coding agents
- Where you've deployed apps before, if anywhere
- Cloudflare products and AI apps you have used, and what interests you
- What you want to build or learn, and how you like to learn, in your own words
- Whether you want a short quiz at the end of each exercise
- Your operating system, which your agent detects by itself so it can give you the right commands
- A one-sentence summary of your answers, written by your agent and shown on the homepage
- Which exercises you've completed
- Whether you completed the interview on the website, or which agent completed an exercise, like Claude Code or Codex
- Which model your agent was running, when it reports one

Your agent also checks whether a few tools it needs are installed, like Node.js and the `cf` CLI. That isn't saved.

## No personal information

Cloudflare Dev School doesn't have accounts. Your student ID is a random name like `smooth-operator-4629`, not your name or email, and nothing above asks who you are. Keep free-text goals and preferences about the project and learning experience, without personal details.

To clear your progress, or to forget your student ID in this browser, use the [Disenroll](/disenroll) page.

## Changing your answers

You can change any answer at any time, in any exercise, just by telling your agent. For example: "turn off quizzes," "I've used AWS before, too," or "I want to focus on building APIs now." Nothing you say here locks you in.
