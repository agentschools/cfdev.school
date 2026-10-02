---
lessonSlug: interview
harness: generic
title: "Interview"
description: "Tell your agent a bit about yourself so it can tailor the course to you."
order: 0
quiz: false
agentInstructions: |
  This is the first lesson. Conduct a short interview, one question at a
  time, and store each answer with PUT /api/students/{id}/interview (a
  partial update, so send only the fields you're setting; once per
  question or one batched call at the end both work). Every question is
  optional: if the student skips one, move on without pushing.

  Before asking anything, GET /api/students/{id}/interview. If the student
  already has answers on file (a 404 means they don't), don't re-ask
  those questions, just confirm nothing has changed and fill in any gaps.

  1. Technical background (`technicalBackground`: "beginner",
     "intermediate", or "advanced"). Ask about their experience with
     programming and the terminal in plain words, then map their answer to
     one of the three values yourself rather than asking them to pick a
     label.

  2. Cloudflare familiarity (`cloudflareFamiliarity`: "new",
     "some-experience", or "regular-user"). Use this only to adjust your
     tone and depth of explanation in later lessons, never to skip lessons
     or change what content you show.

  3. Learning goals (`learningGoals`, free text). What they want to build
     or get out of the course. Store it in their words, lightly trimmed.

  4. Operating system (`os`: "macos", "linux", "windows", or "other").
     Don't ask: detect it yourself (e.g. run `uname`, or check an OS
     environment variable) and tell the student what you found.

  5. Quizzes (`quizOptIn`, boolean). Ask whether they want a short,
     conversational quiz at the end of each lesson. Recommend giving it a
     try, and make clear they can skip any individual quiz or turn quizzes
     off entirely at any time, it's a preference, not a commitment.

  Once you've stored their answers, briefly summarize what you'll do with
  them (how you'll pitch explanations, whether you'll quiz them), then
  mark this lesson complete with PUT /api/progress/{studentId} using
  `{ "lessonSlug": "interview" }` and move on to the next lesson,
  "models". There's no quiz for this lesson.
---

In this lesson, your agent will ask you a few questions about your background and what you want to get out of the course. Your answers help it tailor everything that follows: how much it explains, which examples it reaches for, and how comfortable it assumes you are with the terminal and with Cloudflare.

Every question is optional. Skip any you'd rather not answer.

Your agent will also check which operating system you're on by itself, so it can give you the right commands later on, and it'll ask whether you want a short quiz at the end of each lesson. Quizzes are a good way to check what stuck, and you can skip one or turn them off whenever you like.

Your answers are stored with your student ID, not your name or email. Cloudflare Dev School doesn't have accounts, and doesn't collect personal information.

Early in the course, your agent may ask for permission before running commands or making web requests. Approving those prompts is normal here: it needs to reach this site's API to save your answers and track your progress.
