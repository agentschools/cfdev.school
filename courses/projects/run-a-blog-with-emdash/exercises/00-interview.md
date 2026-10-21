---
description: "Tell your agent what your blog is about, so the course fits it."
agent-instructions: |
  Ask these questions all at once, as short lines, and wait for the
  answers. Every question is optional; skip any the student skips.

  1. What will your blog be about? One line is plenty.
  2. What do you want to call it? (You can change it later.)
  3. Do you already have an EmDash site from Publish a website? yes / no
  4. Do you own a domain you'd like the blog on? yes (which one) / no / not yet

  Save the answers with PUT /api/students/{id}/interviews, with
  "course": "run-a-blog-with-emdash", and a one-sentence summary. If they
  already have an EmDash site, use it in "create-your-blog" instead of
  making a new one. Mark this exercise complete, then start
  "create-your-blog".
---

# Interview

Four quick questions about your blog: what it's about, what it's called, whether you already have an EmDash site, and whether you have a domain. Your agent uses your answers for the rest of the course.
