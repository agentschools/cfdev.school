---
description: "Tell your agent what you already know about this course's topic and what you want to get out of it."
agent-instructions: |
  This course doesn't include its own interview, so write one. Read the
  course's COURSE.md and skim its exercises, then write two to four short
  questions (never more than four) that help you pitch the course to this
  student: how familiar they are with its topic, what they want to get out
  of it, and anything else the course would teach differently depending
  on the answer. First read the student's other interviews with
  GET /api/students/{id}/interviews, and don't ask what they already
  answer (Agent setup's covers agent experience, where they've deployed
  before, what they want to build, and quiz preference). If this course's
  interview is already on file, show the student their answers and only
  ask about what they'd like to change.

  Ask the questions the same way the Agent setup interview does: all at
  once, one short line each, with short answer choices where they fit, in
  a single call to your structured question tool if you have one,
  otherwise in one numbered plain-text message. Every question is
  optional.

  Store the answers with PUT /api/students/{id}/interviews, with this
  course's name as `course`, each question's text as you asked it paired
  with the student's answer, and a one-sentence `summary` addressed to the
  student, as /llms.txt describes. Leave out questions they skipped. If
  they change an answer later, PUT the whole interview again with it
  changed and an updated `summary`. Then mark this exercise complete.

  Use the answers to adjust your tone, depth, and examples for the rest of
  the course, never to skip exercises. There's no quiz for this exercise.
---

# Interview

Before the course starts, your agent asks you a few quick questions about what you already know about its topic and what you want to get out of it, so it can pitch the exercises at the right level.

Every question is optional. You can change any answer later just by telling your agent.
