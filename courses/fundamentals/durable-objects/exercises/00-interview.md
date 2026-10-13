---
description: "Tell your agent what you already know about Durable Objects."
agent-instructions: |
  This course's interview is a single question. Before asking it:

  - GET /api/students/{id}/interviews. If this course's interview is
    already on file, show the student their answer and ask whether it's
    changed. Read Agent setup's interview too, for their experience and
    where they've deployed before.
  - GET /api/progress/{studentId}. If they've completed the Bindings
    course, they've already seen `ctx.exports` and RPC methods on a
    `WorkerEntrypoint`; mention that Durable Objects use the same ideas.

  Ask: "What do you already know about Durable Objects?" Offer these
  choices, plus room to answer in their own words: nothing yet / I've read
  about them / I've built with them. Use your structured question tool if
  you have one, otherwise ask in one plain-text message. It's optional; if
  they skip it, move on.

  Store it with PUT /api/students/{id}/interviews, with
  `"course": "durable-objects"`, the question's text exactly as written
  above, their answer (the choice, or their own words lightly trimmed),
  and a one-sentence `summary` addressed to the student, as /llms.txt
  describes. If they change their answer later, PUT the interview again.

  Use the answer to set depth for the rest of the course: students who
  know nothing get each idea from the ground up, students who've read
  about them get concrete demonstrations of what they've read, and
  students who've built with them can move fast through the mechanics and
  spend their time on the design ideas and the `cf` specifics. Never skip
  exercises because of it.

  Then mark this exercise complete with PUT /api/progress/{studentId} and
  move on to "one-object-per-name". There's no quiz for this exercise.
---

# Interview

Your agent asks you one question before the course starts: what you already know about Durable Objects. Your answer sets how much it explains, from the ground up or straight to the design ideas.

It's optional, and you can change your answer later just by telling your agent.
