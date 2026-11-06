---
description: "Choose an existing Lovable app to migrate, or start with a small shared reading list."
agent-instructions: |
  Read GET /api/students/{id}/interviews and GET /api/progress/{studentId} first. If this interview exists, show the answers and ask whether anything changed.

  Ask the first question using a structured question tool if available, then follow only the relevant branch:
  1. "Have you already created a Lovable app that you'd like to migrate to Cloudflare?" Choices: yes, use my existing app / no, let's build a shared reading list. If yes, ask for the repository or local project location as a follow-up, without requesting credentials or database exports in chat.
  For an existing app only, ask: "Does your app use sign-in, file uploads, AI, functions, or other connected services?" Choices: no / yes, I'll describe them / I'm not sure, help me inspect it.

  For a new app, propose the reading list and ask which three titles they want. Don't ask them to inventory an app that doesn't exist. Save only the questions actually asked.

  Save the answers with PUT /api/students/{id}/interviews, course "move-from-lovable", the question texts above and a short summary addressed to the student, as /llms.txt describes. Record the chosen app and known dependencies; update this interview if the scope changes. If the choice is unanswered, clarify it before creating resources. Don't silently choose a new app.

  Use their existing app throughout if they have one. Never replace it with the reading list to make the exercise pass. In the first exercise inspect its actual framework, schema, data access and services. Agree on which parts will move and which stay before changing anything. Keep production data out of this lab: use a disposable copy with synthetic records. When the app needs migration work beyond this course, explain the gap and pause the affected step, or explicitly keep that service on its existing backend. A frontend-only move is a valid checkpoint but not completion of a database migration. Don't strip features from their app or claim unsupported services migrated.

  If they don't have an app, propose the shared reading list. Don't add AI to it. There's no quiz here. Mark this interview complete with PUT /api/progress/{studentId}, then move to prepare-your-app.
---

# Interview

Already have a Lovable app you'd like to move? We'll use it. Your agent will inspect what it depends on and work with you to choose a safe scope.

Starting fresh? We'll make a small shared reading list with three books. It gives us existing records to move without introducing login, uploads, or AI.

Your agent will also ask which backend services the app uses. It's fine to say you don't know yet.
