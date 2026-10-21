---
description: "Write and publish a post with a tag and a picture, on your own computer."
agent-instructions: |
  The blog from "create-your-blog" should be running (`npm run dev`).

  1. The student writes this post, not you. Ask them for a title and a
     topic that fits their blog. Offer to help them outline it, but the
     words should be theirs. Wait for their reply.
  2. Walk them through the admin panel at
     http://localhost:4321/_emdash/admin/: create a post, write the body,
     add one tag, upload one image (it goes to the local R2 bucket), and
     publish it.
  3. Explain drafts versus published: a draft is only in the admin; a
     published post has a page anyone can visit.
  4. Ask a "what would change if…" question: what would a reader see if
     they had saved it as a draft instead? Wait for the answer.
  5. Verify before completing: find the post's URL on the home page,
     fetch it, and confirm the page returns 200 and contains the
     student's title. Completion waits on this.
  6. Mark complete with PUT /api/progress/{studentId} as /llms.txt
     describes. Then start "make-it-yours".
---

# Write your first post

You'll write a real post in the admin panel: a title, the words, a tag, and a picture. Then you'll publish it and see it on your blog.

## Drafts and published posts

A **draft** lives only in the admin panel. Nobody else can see it. When you **publish**, EmDash gives the post its own page, adds it to your home page, and lists it under its tags.

## Pictures

Images you upload go to your R2 bucket, Cloudflare's file storage. On your computer it's a local copy. Once you deploy, your images live in the real bucket on Cloudflare's network.
