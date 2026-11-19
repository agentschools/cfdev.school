---
description: "Choose how much code and configuration you want your agent to explain while you work through the demo."
agent-instructions: |
  Introduce the demo from the body before asking its single question.
  Use hands-on depth if the student skips the question.
---

# Interview

You'll work on a demo with 3 buttons: **Free user**, **Pro user**, and **Background bot**. Each button sends real AI requests. The lab shows which model handled each request and whether it succeeded, rather than displaying the generated answer.

You'll connect the demo to AI Gateway, label requests by user type, and choose different models for Free and Pro users. Then you'll limit how often the bot can use the higher-cost model, without changing how human users' requests are handled.

Your agent will ask one question before setting up the demo:

**How deep do you want to go?**

- **Big picture:** what each change does and why it matters, using the lab and plain-language explanations instead of code.
- **How it works:** the request flow and key settings, with a little code where it helps.
- **Hands-on:** the code and configuration, including failure modes and trade-offs.

Everyone builds the same demo. Your answer changes how your agent explains it. You can say "less code" or "go deeper" at any point to change the level.
