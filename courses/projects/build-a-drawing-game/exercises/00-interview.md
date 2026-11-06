---
description: "A few quick questions so the game you build fits who's playing, what they'll draw, and the look you want."
agent-instructions: |
  Students can answer these questions on the course's interview page or
  with you. If the website interview is complete, read its saved answers
  and progress, do not repeat skipped questions, and continue to the
  canvas after the prerequisite/context checks below. Never invent a
  harness or model for the website completion.

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

  Ask them all at once, with your structured question tool if you have
  one (in as few calls as it allows), otherwise in one numbered
  plain-text message:

  1. "Who will play your game?" Choose any: Just me / My kids / Friends
     or family / Coworkers / A classroom / A party crowd / Other (their
     own words).
  2. "What should players draw?" Free text, with examples: farm animals,
     things in a kitchen, Cloudflare products, inside jokes.
  3. "What should it look and feel like?" Choose any: Silly and
     cartoony / Clean and minimal / Retro arcade / Hand-drawn and cozy /
     Bright and colorful / Dark and moody / Other (their own words).
  4. "Where will people mostly play it?" Choices: On a phone / On a
     laptop or desktop / Both.

  All four are optional; if they skip one, move on. If the second answer
  is very broad ("anything"), say the game works best with 8 to 15 words
  that look different from each other when drawn, and offer to narrow it
  together in "add-a-decision-model".

  Store them with PUT /api/students/{id}/interviews, with
  `"course": "build-a-drawing-game"`, the questions' text exactly as
  written above, their answers (an array for "Choose any", with Other
  as "Other: their words"), and a one-sentence `summary` addressed to
  the student, as /llms.txt describes. If they change an answer later, PUT
  the interview again.

  Use the first three answers in every exercise: who's playing sets the
  tone and difficulty, what they draw sets the word list, and the look
  sets the page's style. Use where they'll play for canvas size and how
  much phone testing to do. Pitch how much React and browser code you
  explain from Agent setup's coding and web technologies answer
  (HTML, CSS, JavaScript / TypeScript, React, Browser APIs) instead of
  asking again. Never skip exercises because of any of them.

  Then mark this exercise complete with PUT /api/progress/{studentId} and
  move on to "build-a-canvas". There's no quiz for this exercise.
---

# Interview

Answer four optional questions on this page, or take them with your agent: who'll play your game, what they'll draw, how it should look and feel, and where people will play it.

Your answers shape the game you'll build. Two students taking this course should end up with games that look and play differently, even though they learn the same things.

All four questions are optional, and you can change your answers later just by telling your agent.
