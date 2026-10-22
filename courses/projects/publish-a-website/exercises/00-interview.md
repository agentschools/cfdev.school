---
description: "Describe the website you want to build: what it's about, who it's for, what it needs, and how it should look."
interview-questions:
  - question: "What's your website about, and who is it for?"
    type: text
    hint: "A personal site, a project or business, a portfolio, a blog? One line is plenty."
  - question: "What pages or features should it have?"
    type: multiple
    choices: ["a home page", "an about page", "a blog or writing", "a gallery or portfolio", "a contact form", "something interactive"]
  - question: "How should it look?"
    type: text
    hint: "A mood, colors, or a site you like."
  - question: "Do you have a domain name you'd like to use?"
    type: single
    choices: ["yes, on Cloudflare", "yes, somewhere else", "no"]
agent-instructions: |
  This course's interview is four questions. Before asking them:

  - GET /api/students/{id}/interviews. If this course's interview is
    already on file, use the saved answers and accept corrections. Read
    Agent setup's interview too, for their
    experience, where they've deployed before, and what they want to build.
  - GET /api/progress/{studentId}. Note which fundamentals courses they've
    completed (Workers, Bindings), so you can go lighter on what those
    covered later in this course.

  Encourage a real site, something they'd actually share, and keep them on
  goals rather than technology: the next exercise picks the stack from
  these answers. Ask pending questions together, with your structured
  question tool
  if you have one, otherwise in one numbered plain-text message:

  Use `interview-questions` above as the single source of question texts,
  choices, hints, and answer types. Preserve free text for choices too.
  If Agent setup already describes the site, suggest that as a starting
  point. Use saved answers without asking them again. A pair with
  `pending: true` and answer [] is an unfinished web question: ask it on
  resume, then remove `pending` when answered or explicitly skipped. An
  answer of [] without `pending` is an explicit skip: preserve it and don't
  ask it again. Omitted questions in an older saved interview were skipped,
  not pending. For a new interview, ask all four. Accept corrections.

  All four are optional; if they skip one, move on. A one-line answer is
  plenty.

  Store them with PUT /api/students/{id}/interviews, with
  `"course": "publish-a-website"`, the questions' text exactly as written
  in `interview-questions`, their answers, and a one-sentence `summary`
  addressed to the student, as /llms.txt describes. If they change an answer later, PUT the
  interview again.

  Use the first three answers to choose the stack in "choose-your-stack"
  and to shape what you build together in every exercise. Use the fourth
  only in "add-a-domain", to pick which path to take. Never skip exercises
  because of any of them.

  Then mark this exercise complete with PUT /api/progress/{studentId} and
  move on to "choose-your-stack". There's no quiz for this exercise.
---

# Interview

This course is about a website you actually want, so start with a few quick questions here or in your agent: what it's about and who it's for, what pages or features it needs, how it should look, and whether you have a domain name for it.

Think about goals, not technology. Your answers decide which tools you'll build with in the next exercise, and what goes on the site.

All four questions are optional, and you can change your answers later just by telling your agent.
