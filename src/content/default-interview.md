---
description: "Tell your agent what you already know about this course's topic and what you want to get out of it."
agent-instructions: |
  This course doesn't include its own interview, so write one. Read the
  course's COURSE.md and skim its exercises, then write two to four short
  questions that help you pitch the course to this student: how familiar
  they are with its topic, what they want to get out of it, and anything
  else the course would teach differently depending on the answer. Don't
  ask what the Agent setup interview already covers (agent experience,
  platforms used, quiz preference); read those answers with
  GET /api/students/{id}/interview instead.

  Ask the questions the same way the Agent setup interview does: all at
  once, one short line each, with short answer choices where they fit, in
  a single call to your structured question tool if you have one,
  otherwise in one numbered plain-text message. Every question is
  optional.

  Use the answers to adjust your tone, depth, and examples for the rest of
  the course, never to skip exercises. There's no quiz for this exercise.
---

# Interview

Before the course starts, your agent asks you a few quick questions about what you already know about its topic and what you want to get out of it, so it can pitch the exercises at the right level.

Every question is optional. You can change any answer later just by telling your agent.
