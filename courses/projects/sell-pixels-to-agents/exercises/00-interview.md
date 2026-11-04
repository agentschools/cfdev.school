---
description: "Choose your canvas, pixel price, and shop's personality."
agent-instructions: |
  Read GET /api/students/{id}/interviews and GET /api/progress/{studentId}.
  If this interview exists, show its answers and ask what changed. Use Agent
  setup's answers for background and quiz preference. If they've finished
  Durable Objects, go lighter on storage explanations later.
  
  Ask these four questions together, using a structured question tool if
  available. All are optional; wait for the student's reply.
  1. "How big should your canvas be?" Suggest 100×100; accept integer sides
     from 1 to 200 so the first version stays small.
  2. "What should a pixel cost in test USDC?" Suggest $0.01; accept a positive
     decimal with at most six decimal places. This sets the shop's price,
     not permission for the buyer to spend anything.
  3. "What should your pixel shop be called, and what should it feel like?"
  4. "Whose agent might be your second customer?" Suggest a fresh session
     of their own agent or a friend's agent. Don't contact anyone for them.
  
  Save the questions exactly as written, answers, and a one-sentence summary
  addressed to the student with PUT /api/students/{id}/interviews, course
  sell-pixels-to-agents, as /llms.txt describes. Use defaults for skipped
  answers. Explain that all purchases through Open the shop use test tokens.
  Mark this exercise complete with PUT /api/progress/{studentId}, then move
  to create-wallets. No quiz for the interview.
---

# Interview

Choose the size of your canvas, the price of a pixel, and the name and feel of your shop. Think of another agent that might visit later. A fresh conversation with your own agent works too.

The defaults are 100×100 and $0.01 per pixel, paid with test tokens. You can change your answers later.
