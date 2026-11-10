---
description: "Tell your agent what you already know about background jobs and which parts of the project you want to explore."
agent-instructions: |
  Before asking questions, GET /api/students/{id}/interviews and read the student's existing interviews, including Agent setup's. If this course already has an interview, show its answers and ask whether they want to keep or change them.

  Ask all 3 questions at once. Use the harness's structured question tool if available. Otherwise put them in a numbered plain-text message. Keep the exact question text below when saving the answers:

  1. "Have you built work that continues after a web request ends? What kind of work, if any?"
  2. "Which of Cloudflare Workflows, Durable Objects, RPC, and WebSockets have you used before, if any?"
  3. "Which part would you like me to explain in more depth: Workflow steps, Durable Objects, WebSocket delivery, or the React app?"

  All 3 questions are optional. If the student skips a question, continue. Save the question-and-answer pairs with PUT /api/students/{id}/interviews, using course "realtime-workflows" and a 1-sentence summary addressed to the student. If they change an answer later, send the full interview again.

  Use the answers to tune explanations and examples throughout the course. Never skip or reorder an exercise because of an answer. Then mark this exercise complete with PUT /api/progress/{studentId}, using course "realtime-workflows", exercise "interview", and your harness ID. There is no quiz for this exercise.
---

# Interview

Before you build the app, your agent will ask about your experience with background jobs and Cloudflare's tools, and which part of the project you want to explore in more depth.

All 3 questions are optional. You can change your answers later by telling your agent.
