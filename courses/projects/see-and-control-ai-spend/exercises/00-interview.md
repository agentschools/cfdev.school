---
description: "Tell your agent what app you want to put spend controls on, who calls the AI in it, and what lens you bring."
agent-instructions: |
  This course's interview is four questions. Before asking them:

  - GET /api/students/{id}/interviews. If this course's interview is
    already on file, show the student their answers and ask whether
    they've changed. Read Agent setup's interview too, for their agent
    experience, where they've deployed before, and what they want to build.
  - GET /api/progress/{studentId}. Note whether they've completed Build a
    guestbook, Build a drawing game, Workers, Bindings, or AI Gateway so
    you can build on what they already have or go lighter on concepts
    they've already seen.

  Ask all four at once, with your structured question tool if you have
  one, otherwise in one numbered plain-text message:

  1. "Where should we add AI spend controls?"
     Choices: on an app I already built in Dev School or on Cloudflare / in a new mini-app (for example a support desk, a document summarizer, a coding assistant, or your own idea).
  2. "Who calls the AI in your app?"
     Choices: free and paid customer tiers / two internal teams (like interns and escalations) / customers plus a background bot or batch job (we'll wire up two human caller types and one automated background caller that fit your app).
  3. "How much have you worked with model token pricing and AI cost controls before?"
     Choices: brand new to it / I've seen provider bills or token pricing / I've configured AI gateways, routing, or spend budgets before.
  4. "What's your main goal for taking this course?"
     Choices: controlling AI costs and unit economics in an app I'm building / helping customers or teams design and govern their AI spend / a mix of both.

  All four are optional; if they skip one, move on.

  Store the answers with PUT /api/students/{id}/interviews, with
  `"course": "see-and-control-ai-spend"`, the questions' text exactly as written
  above, their answers, and a one-sentence `summary` addressed to the
  student, as /llms.txt describes. If they change an answer later, PUT the
  interview again.

  Use the answers in every exercise:
  - Questions 1 and 2 shape the app and its three callers (two human tiers
    or teams plus one automated background task, such as a ticket
    auto-tagger, PR reviewer, or nightly summarizer) so the page and
    prompts feel like their project, not a generic demo.
  - Question 3 sets how much you explain first principles (what tokens are,
    why shared API keys hide caller identity, and how proxy checkpoints
    work) before running setup commands.
  - Question 4 selects which end-of-exercise scenario hook you lean into
    (architectural trade-offs for builders vs. customer discovery and
    objections for customer-facing roles).
  Never skip exercises because of any answer.

  Then mark this exercise complete with PUT /api/progress/{studentId} and
  move on to "see-the-blind-spot". There's no quiz for this exercise.
---

# Interview

Before you write any code, your agent asks four quick questions: whether you want to add spend controls to an existing app or spin up a new one, who calls the AI in it, how familiar you are with token billing, and whether you're here mainly as a builder, an advisor to customers, or both.

Your answers shape the app you'll work on and how your agent teaches each step. Every student wires up the same core controls — caller attribution, model tiering, and isolated agent budgets — on an app tailored to their own scenario.

All four questions are optional, and you can update your answers anytime by telling your agent.
