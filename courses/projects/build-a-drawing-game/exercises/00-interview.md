---
description: "Tell your agent who your game is for, what players will draw, and how they'll play it."
agent-instructions: |
  This course's interview is four questions. Before asking them:

  - GET /api/students/{id}/interviews. If this course's interview is
    already on file, show the student their answers and ask whether
    they've changed. Read Agent setup's interview too.
  - GET /api/progress/{studentId}. Note whether they've completed Build a
    guestbook (its "moderate-messages" exercise already introduced Clef,
    so you can go lighter on decision models) and Durable Objects (it
    explains the strict rate limit "launch-your-game" mentions).

  If the student hasn't watched the video on the course page, offer the
  course page (`/courses/build-a-drawing-game` on this school's site)
  and a one-line summary:
  someone draws, a decision model on Workers AI scores every word on a
  list, and the highest bar is its guess. Watching is optional.

  Ask all four at once, with your structured question tool if you have
  one, otherwise in one numbered plain-text message:

  1. "Who is your game for?" Free text, with examples: my kids, friends
     at a party, my coworkers, just me.
  2. "What should players draw?" Free text, with examples: farm animals,
     things in a kitchen, Cloudflare products, inside jokes.
  3. "How much have you built for the browser before?" Choices: nothing
     yet / some HTML, CSS, or JavaScript / I've built React apps.
  4. "Where will people mostly play it?" Choices: on a phone / on a
     laptop or desktop / both.

  All four are optional; if they skip one, move on. If the second answer
  is very broad ("anything"), say the game works best with 8 to 15 words
  that look different from each other when drawn, and offer to narrow it
  together in "add-a-decision-model".

  Store them with PUT /api/students/{id}/interviews, with
  `"course": "build-a-drawing-game"`, the questions' text exactly as
  written above, their answers, and a one-sentence `summary` addressed to
  the student, as /llms.txt describes. If they change an answer later, PUT
  the interview again.

  Use the first two answers in every exercise: they set the game's look,
  tone, and word list. Use the third to pitch how much React and browser
  code you explain, and the fourth for canvas size and how much phone
  testing to do. Never skip exercises because of any of them.

  Then mark this exercise complete with PUT /api/progress/{studentId} and
  move on to "build-a-canvas". There's no quiz for this exercise.
---

# Interview

Your agent asks you four questions before you start: who your game is for, what players should draw, how much you've built for the browser, and where people will mostly play it.

Your answers shape the game you'll build. Two students taking this course should end up with games that look and play differently, even though they learn the same things.

All four questions are optional, and you can change your answers later just by telling your agent.
