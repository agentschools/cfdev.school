---
description: "Tell your agent what you already know about AI gateways, which model providers you use, and what you care most about controlling."
agent-instructions: |
  This course's interview is three questions. Before asking them:

  - GET /api/students/{id}/interviews. If this course's interview is
    already on file, show the student their answers and ask whether
    they've changed. Read Agent setup's interview too, for their agent
    experience and where they've deployed before.
  - GET /api/progress/{studentId}. Note whether they've completed
    Workers or Bindings (so you can go lighter on Worker setup and
    bindings), or Build a guestbook / Build a drawing game (which both
    send a Workers AI call through the `default` gateway).

  Ask all three at once, with your structured question tool if you have
  one, otherwise in one numbered plain-text message:

  1. "Have you called AI models from an application or used an AI gateway before?"
     Choices: not yet / I've called model APIs directly / I've used AI Gateway or another proxy.
  2. "Which model providers do you mostly use or want to use?"
     Choices: Workers AI / OpenAI or Anthropic / Google, Bedrock, or multiple providers / not sure yet.
  3. "What's your biggest concern when running AI in an app?"
     Choices: seeing what requests cost and who's making them / keeping latency and repeat spend down / switching models and handling outages without redeploying / stopping prompt injection and sensitive data leaks.

  All three are optional; if they skip one, move on.

  Store the answers with PUT /api/students/{id}/interviews, with
  `"course": "ai-gateway"`, the questions' text exactly as written above,
  their answers, and a one-sentence `summary` addressed to the student, as
  /llms.txt describes. If they change an answer later, PUT the interview
  again.

  Use the answers throughout the course:
  - Question 1 sets explanation depth: if they're new to model APIs or
    gateways, ground each concept from first principles (what an AI
    gateway is, what metadata tags are, why routes and caches exist)
    before running commands; if they've used a proxy before, focus on
    how Cloudflare's gateway works.
  - Question 2 shapes your examples: the hands-on exercises use Workers AI
    so no external API keys are required, and you'll show one-line
    comparisons for the provider(s) they named.
  - Question 3 tells you which exercise to lean into hardest.
  Never skip exercises because of any answer.

  Do not rely on the web page's demo videos to teach concepts: teach
  every concept directly in your conversation using clear explanations,
  compact diagrams, and code, and only mention the exercise page or video
  link as an optional extra.

  Then mark this exercise complete with PUT /api/progress/{studentId} and
  move on to "see-every-request". There's no quiz for this exercise.
---

# Interview

Your agent asks you three quick questions before the course starts: what you've built with AI models so far, which providers you care about, and what matters most to you when running AI in production. Your answers set how much it explains and which examples it uses.

They're optional, and you can change your answers later just by telling your agent.
