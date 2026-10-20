---
description: "Tell your agent what you already know about bindings."
agent-instructions: |
  This course's interview is a single question. Before asking it:

  - GET /api/students/{id}/interviews. If this course's interview is
    already on file, show the student their answer and ask whether it's
    changed. Read Agent setup's interview too, for their experience and
    where they've deployed before.
  - GET /api/progress/{studentId}. If they've completed the Workers course,
    they've already declared a KV binding by hand in "Add a binding", so
    mention that and pitch this course as the "why" behind it.

  Ask: "What do you already know about bindings?" Offer these choices,
  plus room to answer in their own words: nothing yet / I've used one or
  two / I use them all the time. Follow /llms.txt's
  "Asking and answering questions" policy. The question is optional.

  Store it with PUT /api/students/{id}/interviews, with
  `"course": "bindings"`, the question's text exactly as written above,
  their answer (the choice, or their own words lightly trimmed), and a
  one-sentence `summary` addressed to the student, as /llms.txt describes.
  If they change their answer later, PUT the interview again.

  Use the answer to set depth for the rest of the course: students who
  know nothing get each idea from the ground up, students who've used a
  binding or two get the reasoning behind what they've already done, and
  everyday users can move fast through the mechanics and spend their time
  on the design ideas. Never skip exercises because of it.

  Then mark this exercise complete with PUT /api/progress/{studentId} and
  move on to "live-objects". There's no quiz for this exercise.
---

# Interview

Your agent asks you one question before the course starts: what you already know about bindings. Your answer sets how much it explains, from the ground up or straight to the design ideas.

It's optional, and you can change your answer later just by telling your agent.
