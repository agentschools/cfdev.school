---
description: "Tell your agent what you already know about AI gateways, which model providers you use, what you care most about controlling, and how you want to use the short demo clips."
agent-instructions: |
  This course's interview is four questions. Before asking them:

  - GET /api/students/{id}/interviews. If this course's interview is
    already on file, show the student their answers and ask whether
    they've changed. Read Agent setup's interview too, for their agent
    experience and where they've deployed before.
  - GET /api/progress/{studentId}. Note whether they've completed
    Workers or Bindings (so you can go lighter on Worker setup and
    bindings), or Build a guestbook / Build a drawing game (which both
    send a Workers AI call through the `default` gateway).

  Ask all four at once, with your structured question tool if you have
  one, otherwise in one numbered plain-text message:

  1. "Have you called AI models from an application or used an AI gateway before?"
     Choices: not yet / I've called model APIs directly / I've used AI Gateway or another proxy.
  2. "Which model providers do you mostly use or want to use?"
     Choices: Workers AI / OpenAI or Anthropic / Google, Bedrock, or multiple providers / not sure yet.
  3. "What's your biggest concern when running AI in an app?"
     Choices: seeing what requests cost and who's making them / keeping latency and repeat spend down / switching models and handling outages without redeploying / stopping prompt injection and sensitive data leaks.
  4. "This course has short (under 2-minute) demo clips for each exercise. How should we use them?"
     Choices: show me the clips as we go / just link them in case I want to watch / skip videos, stick to text and code.

  All four are optional; if they skip one, move on.

  If they answered "show me the clips as we go" on question 4, share the
  90-second overview clip right after they reply (`<origin>/media/courses/ai-gateway/overview.mp4`,
  where `<origin>` is the site you fetched `/llms.txt` from):
  - If you have a built-in browser panel tool (such as `openchamber_web`'s
    `browser.open`), open `<origin>/courses/ai-gateway` in it so the video
    is right beside the chat.
  - Otherwise, include a clickable Markdown preview card
    `[![Watch the 90-second overview](<origin>/media/courses/ai-gateway/overview-poster.jpg)](<origin>/media/courses/ai-gateway/overview.mp4)`
    plus the direct link, and offer to open it in their default browser
    (`open` on macOS, `xdg-open` on Linux, `start` on Windows).

  Store the answers with PUT /api/students/{id}/interviews, with
  `"course": "ai-gateway"`, the questions' text exactly as written above,
  their answers, and a one-sentence `summary` addressed to the student, as
  /llms.txt describes. If they change an answer later, PUT the interview
  again.

  Use the answers throughout the course:
  - Question 1 sets explanation depth (from the ground up vs. straight to
    how Cloudflare's gateway works).
  - Question 2 shapes your examples: the hands-on exercises use Workers AI
    so no external API keys are required, and you'll show one-line
    comparisons for the provider(s) they named.
  - Question 3 tells you which exercise to lean into hardest.
  - Question 4 controls how you handle video in every exercise: push and
    open/preview the clip when they want videos, drop a one-line link when
    they want links only, and never mention or link videos when they chose
    to skip them.
  Never skip exercises because of any answer.

  Then mark this exercise complete with PUT /api/progress/{studentId} and
  move on to "see-every-request". There's no quiz for this exercise.
---

# Interview

Your agent asks you a few questions before the course starts: what you've built with AI models so far, which providers you care about, and whether you want the short demo clips shown as you go. Your answers set how much it explains and which examples it uses.

They're optional, and you can change your answers later just by telling your agent.
