---
description: "Tell your agent how deep you want to go, what the three-caller demo represents, and which model providers you use."
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
  2. "What should the support-desk demo represent?"
     Choices: customer support / an internal operations tool / another product workflow.
  3. "Who should the three caller buttons represent?"
     Choices: free and paid customers plus a background bot / two customer groups plus a background bot / keep the starter's free user, pro user, and background bot.
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
  - The course always uses the three-caller starter repository linked in
    `COURSE.md`. Never create a separate Worker, replace the starter UI, or
    add this lab to one of the student's other projects. Questions 2 and 3
    shape the demo's heading, button labels, and sample prompts. Keep the
    caller IDs (`free`, `pro`, `bot`) and the `tier` and `task` values in
    `src/demo-data.ts` unchanged so the Gateway rules in later exercises
    keep matching.
  - Question 4 shapes comparisons only: the lab always runs on Workers
    AI, so nobody needs a provider API key. When a step mentions
    providers, use the ones they named (e.g. "the same metadata works on
    your OpenAI calls through the gateway").

  Then mark this exercise complete with PUT /api/progress/{studentId} and
  move on to "see-the-blind-spot". There's no quiz for this exercise.
---

# Interview

Before you change the Worker, your agent asks four quick questions: how deep you want to go, what the support-desk demo represents, who the three callers stand for, and which model providers you or your customers use.

How deep you go sets how technical each step gets: the big picture with no code, how it works with the key settings, or hands-on with the code. Everyone starts from the same app and adds the same Gateway controls. Your other answers shape its labels, prompts, and examples.

All four questions are optional, and you can change your answers anytime by telling your agent, for example "less code" or "go deeper".
