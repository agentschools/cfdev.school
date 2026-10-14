---
description: "Describe the website you want to build: what it's about, who it's for, what it needs, and how it should look."
agent-instructions: |
  This course's interview is four questions. Before asking them:

  - GET /api/students/{id}/interviews. If this course's interview is
    already on file, show the student their answers and ask whether
    they've changed. Read Agent setup's interview too, for their
    experience, where they've deployed before, and what they want to build.
  - GET /api/progress/{studentId}. Note which fundamentals courses they've
    completed (Workers, Bindings), so you can go lighter on what those
    covered later in this course.

  Encourage a real site, something they'd actually share, and keep them on
  goals rather than technology: the next exercise picks the stack from
  these answers. Ask all four at once, with your structured question tool
  if you have one, otherwise in one numbered plain-text message:

  1. "What's your website about, and who is it for?" Free text. If what
     they wanted to build in Agent setup's interview answers this, suggest
     it. Otherwise offer starting points: a personal site, a page for a
     project or business, a portfolio, a blog.
  2. "What pages or features should it have?" Choices (more than one is
     fine), plus room to answer in their own words: a home page / an about
     page / a blog or writing / a gallery or portfolio / a contact form /
     something interactive.
  3. "How should it look?" Free text: a mood, colors, or a site or two they
     like the look of.
  4. "Do you have a domain name you'd like to use?" Choices: yes, on
     Cloudflare / yes, somewhere else / no.

  All four are optional; if they skip one, move on. A one-line answer is
  plenty.

  Store them with PUT /api/students/{id}/interviews, with
  `"course": "publish-a-website"`, the questions' text exactly as written
  above, their answers, and a one-sentence `summary` addressed to the
  student, as /llms.txt describes. If they change an answer later, PUT the
  interview again.

  Use the first three answers to choose the stack in "choose-your-stack"
  and to shape what you build together in every exercise. Use the fourth
  only in "add-a-domain", to pick which path to take. Never skip exercises
  because of any of them.

  Then mark this exercise complete with PUT /api/progress/{studentId} and
  move on to "choose-your-stack". There's no quiz for this exercise.
---

# Interview

This course is about a website you actually want, so your agent starts by asking about it: what it's about and who it's for, what pages or features it needs, how it should look, and whether you have a domain name for it.

Think about goals, not technology. Your answers decide which tools you'll build with in the next exercise, and what goes on the site.

All four questions are optional, and you can change your answers later just by telling your agent.
