---
description: "Set your blog's title, write an About page, and set up the menu."
agent-instructions: |
  1. Ask the student what their blog's title and one-line tagline should
     be. Wait for their reply. Set them in the admin's site settings.
  2. Have them create an About page in the admin (a page, not a post):
     who they are and what the blog is for, in their own words.
  3. Add Home and About to the site menu in the admin.
  4. Show the difference between content (settings, pages, menus: edited
     in the admin, stored in D1) and code (the theme's Astro files in
     src/). Offer one small code change the student picks, like an accent
     color. Show them the change and wait for their OK before saving.
  5. Try it: have them change the tagline once more and reload the page.
  6. Verify before completing: fetch http://localhost:4321/ and confirm
     the page contains the student's blog title, and fetch the About
     page and confirm a 200. Completion waits on both.
  7. Mark complete with PUT /api/progress/{studentId} as /llms.txt
     describes. Then start "go-live".
---

# Make it yours

Your blog has a post. Now make it look and read like yours: a title, a tagline, an About page, and a menu.

## Content and code

Some things you change in the admin panel: the title, pages, and menus. They're content, stored in your database, and you can change them any time without touching code.

Other things live in code: the layout, fonts, and colors in your theme's files. Your agent can change those for you, and you'll approve each change before it's saved.
