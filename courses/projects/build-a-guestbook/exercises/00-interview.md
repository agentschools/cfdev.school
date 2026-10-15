---
description: "Tell your agent where your guestbook will live, how it should feel, and how it should handle spam and new entries."
agent-instructions: |
  This course's interview is four questions. Before asking them:

  - GET /api/students/{id}/interviews. If this course's interview is
    already on file, show the student their answers and ask whether
    they've changed. Read Agent setup's interview too, and Publish a
    website's if it's there: its answers describe their site.
  - GET /api/progress/{studentId}. Note which courses they've completed:
    Publish a website (so they have a site and a project `AGENTS.md` to
    build on), and Bindings or Durable Objects (so you can go lighter on
    bindings and storage later).

  Ask all four at once, in one numbered plain-text message:

  1. "Where should your guestbook live?" Choices: on the site I built in
     Publish a website / in another app I have on Cloudflare / in a new
     Worker made just for it. If they've completed Publish a website,
     suggest the first.
  2. "What should it feel like?" Free text, with examples: a classic
     guestbook, "leave a note", a wall of messages from fans or customers.
  3. "How strict should it be about spam?" Choices: hold anything that
     looks questionable / only hold obvious spam.
  4. "How would you like to hear about new entries?" Choices: by email (I
     have a domain on Cloudflare) / in Discord / in Slack.

  All four are optional; if they skip one, move on. If they choose email
  but don't have a domain on Cloudflare, say that email needs one, and
  offer Discord or Slack, or adding a domain first (Publish a website's
  "add-a-domain" exercise).

  Store them with PUT /api/students/{id}/interviews, with
  `"course": "build-a-guestbook"`, the questions' text exactly as written
  above, their answers, and a one-sentence `summary` addressed to the
  student, as /llms.txt describes. If they change an answer later, PUT the
  interview again.

  Use the first two answers in every exercise, the third in
  "moderate-messages" (it sets the threshold), and the fourth in
  "get-notified" (it picks the path). Never skip exercises because of
  any of them.

  Then mark this exercise complete with PUT /api/progress/{studentId} and
  move on to "build-the-ui". There's no quiz for this exercise.
---

# Interview

Your agent asks you four questions before you start: where your guestbook will live, what it should feel like, how strict it should be about spam, and how you'd like to hear about new entries.

If you've taken [Publish a website](/courses/publish-a-website), your site is a natural home for it. You can also add it to another app you have on Cloudflare, or start a new Worker just for the guestbook.

All four questions are optional, and you can change your answers later just by telling your agent.
