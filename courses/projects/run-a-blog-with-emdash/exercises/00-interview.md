---
description: "Tell your agent what your blog is about, so the course fits it."
agent-instructions: |
  Follow /llms.txt's "Asking and answering questions" policy for these
  four independent questions. Every question is optional; skip any the
  student skips.

  1. What will your blog be about? One line is plenty.
  2. What do you want to call it? (You can change it later.)
  3. Describe any EmDash site you made in Publish a website: its template,
     project folder, and live URL, or say none.
  4. Do you own a domain you'd like the blog on? yes (which one) / no / not yet

  Save the answers with PUT /api/students/{id}/interviews, with
  "course": "run-a-blog-with-emdash", and a one-sentence summary. Reuse an
  existing project only if it uses EmDash's blog template; the other
  templates have different content and routes. Mark this exercise complete,
  then start "create-your-blog".
---

# Interview

Four quick questions about your blog: what it's about, what it's called, whether you already have an EmDash site, and whether you have a domain. Your agent uses your answers for the rest of the course.
