---
lessonSlug: interview
harness: generic
title: "Interview"
description: "Tell your agent a bit about yourself so it can tailor the course to you."
order: 0
quiz: false
agentInstructions: |
  This is the first lesson: a short interview. Ask all the questions at
  once, not one at a time, so the student only waits on you once. Keep
  every question to one short line with short answer choices, so the
  student can answer quickly.

  Before asking anything, GET /api/students/{id}/interview. If the student
  already has answers on file (a 404 means they don't), only ask the
  questions they haven't answered yet, and show them what's on file.

  How to ask:

  - If you have a structured question tool (e.g. Claude Code's
    `AskUserQuestion`, OpenCode's `question`, Codex's `request_user_input`
    in Plan mode), put all the questions in one call. If the tool caps how
    many questions fit in one call, use as few calls as possible.
  - Otherwise, ask them all in one numbered plain-text message, and tell
    the student they can answer in one reply, e.g. "1b, 2a, 3: a todo app,
    4 yes".

  The questions (every one is optional, if the student skips one, move on
  without pushing):

  1. "How comfortable are you with code and the terminal?" Choices:
     new to it / some experience / very comfortable. Store as
     `technicalBackground`: "beginner", "intermediate", or "advanced".
  2. "How familiar are you with Cloudflare?" Choices: new to it / used it
     a bit / use it regularly. Store as `cloudflareFamiliarity`: "new",
     "some-experience", or "regular-user". Use this only to adjust your
     tone and depth of explanation in later lessons, never to skip lessons
     or change what content you show.
  3. "What do you want to build or learn?" Free text, one line is plenty.
     Store as `learningGoals` in their words, lightly trimmed.
  4. "Want a short quiz at the end of each lesson? (recommended, skippable
     anytime)" Choices: yes / no. Store as `quizOptIn`.

  Don't ask about their operating system: detect it yourself (e.g. run
  `uname`, or check an OS environment variable), store it as `os`
  ("macos", "linux", "windows", or "other"), and mention what you found.

  Store the answers with PUT /api/students/{id}/interview. It's a partial
  update, so send only the fields you're setting; one call with all of
  them is fine.

  Then, in two or three sentences: summarize what you'll do with their
  answers (how you'll pitch explanations, whether you'll quiz them), and
  tell them plainly that they can change any of it at any time just by
  telling you, e.g. "turn off quizzes" or "I'm more experienced than I
  said". Whenever a student asks to change an answer, in this lesson or
  any later one, PUT just that field and adjust from then on.

  Finally, mark this lesson complete with PUT /api/progress/{studentId}
  using `{ "lessonSlug": "interview" }` and move on to the next lesson,
  "models". There's no quiz for this lesson.
---

In this lesson, your agent will ask you a few questions about your background and what you want to get out of the course. Your answers help it tailor everything that follows: how much it explains, which examples it reaches for, and how comfortable it assumes you are with the terminal and with Cloudflare.

Your agent asks all the questions at once, and each one takes a few words to answer. Every question is optional. Skip any you'd rather not answer.

Your agent will also check which operating system you're on by itself, so it can give you the right commands later on, and it'll ask whether you want a short quiz at the end of each lesson. Quizzes are a good way to check what stuck.

You can change any of your answers at any time, in any lesson, just by telling your agent. For example: "turn off quizzes," "I'm more comfortable with the terminal than I said," or "I want to focus on building APIs now." Nothing you say here locks you in.

Your answers are stored with your student ID, not your name or email. Cloudflare Dev School doesn't have accounts, and doesn't collect personal information.

Early in the course, your agent may ask for permission before running commands or making web requests. Approving those prompts is normal here: it needs to reach this site's API to save your answers and track your progress.
