---
description: "Tell your agent what website you want to build, and whether you have a domain for it."
agent-instructions: |
  This course's interview is two questions. Before asking them:

  - GET /api/students/{id}/interviews. If this course's interview is
    already on file, show the student their answers and ask whether
    they've changed. Read Agent setup's interview too, for their
    experience, where they've deployed before, and what they want to build.
  - GET /api/progress/{studentId}. Note which fundamentals courses they've
    completed (Workers, Bindings), so you can go lighter on what those
    covered later in this course.

  Ask both at once, with your structured question tool if you have one,
  otherwise in one numbered plain-text message:

  1. "What do you want your website to be?" Choices, plus room to answer
     in their own words: a personal site / a page for a project / a
     portfolio. One line is plenty.
  2. "Do you have a domain name you'd like to use?" Choices: yes, on
     Cloudflare / yes, somewhere else / no.

  Both are optional; if they skip one, move on. If what they wanted to
  build in Agent setup's interview already answers the first question,
  suggest that as the answer.

  Store them with PUT /api/students/{id}/interviews, with
  `"course": "publish-a-website"`, the questions' text exactly as written
  above, their answers, and a one-sentence `summary` addressed to the
  student, as /llms.txt describes. If they change an answer later, PUT the
  interview again.

  Use the first answer to shape the site you build together in every
  exercise. Use the second only in "use-your-own-domain", to pick which
  path to take. Never skip exercises because of either.

  Then mark this exercise complete with PUT /api/progress/{studentId} and
  move on to "put-your-site-online". There's no quiz for this exercise.
---

# Interview

Your agent asks you two questions before you start: what you want your website to be, and whether you have a domain name for it. Your answers shape the site you'll build, and which way you'll go in the last exercise.

Both are optional, and you can change your answers later just by telling your agent.
