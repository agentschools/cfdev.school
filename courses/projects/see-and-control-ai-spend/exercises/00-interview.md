---
description: "Tell your agent how deep you want to go, where you want to add spend controls, who calls the AI in your app, and which model providers you use."
agent-instructions: |
  This course's interview is four questions. Before asking them:

  - GET /api/students/{id}/interviews. If this course's interview is
    already on file, show the student their answers and ask whether
    they've changed. Read Agent setup's interview too, for their agent
    experience, where they've deployed before, and what they want to build.
  - GET /api/progress/{studentId}. Note whether they've completed the AI
    Gateway course (go lighter on gateways, metadata, routes, and spend
    limits; every exercise says what to shorten) and which apps they've
    built in other courses (Publish a website, Build a guestbook, Build a
    drawing game, Workers, Bindings).

  Ask all four at once, with your structured question tool if you have
  one, otherwise in one numbered plain-text message:

  1. "How deep do you want to go?"
     Choices: big picture: what it does and why it matters, no code (for example sales, product, finance, or leadership) / how it works: the architecture and key settings, light on code (for example technical sales, architects, consultants, or team leads) / hands-on: the code and config (for example developers).
  2. "Where should we add AI spend controls?"
     Choices: an app I already built on Cloudflare / a new mini-app (a support desk by default, or your own idea).
  3. "Who calls the AI in your app?"
     Choices: free and paid customer tiers / two internal teams / customers plus a background bot or batch job. (Whatever they pick, the app gets two kinds of human callers and one automated background caller.)
  4. "Which model providers do you or your customers use today?"
     Choices (several allowed): Workers AI / OpenAI / Anthropic / Google / a mix / none yet or not sure.

  All four are optional; if they skip one, move on. Store the answers with
  PUT /api/students/{id}/interviews, with
  `"course": "see-and-control-ai-spend"`, the questions' text exactly as
  written above, their answers, and a one-sentence `summary` addressed to
  the student, as /llms.txt describes.

  How the answers shape every exercise (never skip one because of them):

  - Question 1 sets the depth. Everyone builds the same app; only the
    explanation changes. The examples in its choices are hints, not
    roles to hold the student to:
    - Big picture: everyday words ("big model", "small model", "the
      bill"), no parameter counts or token math. Show the lab page and
      the dashboard, not code: sum up each code or config change in one
      plain sentence before it ships. Checks ask them to explain the idea
      to someone they work with (a customer, their manager, or their
      finance team), or offer a quick role-play.
    - How it works: model names and why they cost what they cost, and
      the key config (metadata, the route's JSON, the spend limit rule)
      rather than every line of code. Checks mix trade-offs with
      explaining it to someone they work with.
    - Hands-on (and the default if they skip the question): the code and
      config, failure modes, and trade-offs in their own app.
    If the student says "less code", "go deeper", or similar at any
    point, move them to that level and PUT the interview again with the
    answer changed.
  - Questions 2 and 3 shape the app, its three callers, and their names,
    so it feels like their project. If they pick an app they built in
    Build a guestbook or Build a drawing game, say those call Clef, a
    decision model that scores options rather than writing replies, and
    recommend the new mini-app; build on their app only if they insist,
    adding a chat call alongside Clef.
  - Question 4 shapes comparisons only: the lab always runs on Workers
    AI, so nobody needs a provider API key. When a step mentions
    providers, use the ones they named (e.g. "the same metadata works on
    your OpenAI calls through the gateway").

  Then mark this exercise complete with PUT /api/progress/{studentId} and
  move on to "see-the-blind-spot". There's no quiz for this exercise.
---

# Interview

Before you build anything, your agent asks four quick questions: how deep you want to go, whether to add spend controls to an app you already have or a new mini-app, who calls the AI in it, and which model providers you or your customers use.

How deep you go sets how technical each step gets: the big picture with no code, how it works with the key settings, or hands-on with all the code. Everyone builds the same thing, a small app whose three callers you can see, tier, and cap. The other answers shape the app, so it looks like yours.

All four questions are optional, and you can change your answers anytime by telling your agent, for example "less code" or "go deeper".
