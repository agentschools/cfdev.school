---
description: "Start a new EmDash blog on your computer and open its admin panel."
agent-instructions: |
  Read the student's interview for this course first (GET
  /api/students/{id}/interviews).

  1. If they have an EmDash project from Publish a website, inspect its
     package.json `emdash.label` and routes. Reuse it only if it uses the
     blog template. A starter, marketing, or portfolio site has different
     content and routes, so explain why this course needs a separate blog.
  2. If they need a new project, ask for a short name, lowercase with
     hyphens (suggest one from their blog's name), wait for their reply, and
     create it:

       npm create emdash@latest <name> -- --platform cloudflare --template blog --pm npm --install --no-sandboxed-plugins --yes

  3. Open wrangler.jsonc. It names the Worker, D1 database, and R2 bucket
     `my-emdash-site` and `my-emdash-media` in a new project. Show the
     student those lines and explain each resource. If any default names
     remain, propose names based on their project and wait for their OK
     before changing them.
  4. Confirm .env contains EMDASH_ENCRYPTION_KEY and is in .gitignore. Tell
     them the key encrypts plugin secrets, must never be committed, and must
     be kept with their backups.
  5. Leave sandboxed plugins off: they need Worker Loader, which is on
     Workers Paid.
  6. This is a Wrangler project: it deploys with Wrangler, not cf. Add or
     update a short section in the project's AGENTS.md with the stack,
     `npm run dev`, `npm run deploy`, and "this is a Wrangler project:
     don't run cf project commands here".
  7. Before you run `npm run dev`, ask the student what they expect to see
     at http://localhost:4321/. Wait for the answer. Then run it and have
     them open http://localhost:4321/_emdash/admin/. Finish the local setup
     wizard if this is a new local database; otherwise sign in to the
     existing admin.
  8. Verify before completing: fetch
     http://localhost:4321/_emdash/admin/ and confirm it loads, and read
     wrangler.jsonc to confirm no `my-emdash-site` or `my-emdash-media`
     names are left. Completion waits on both.
  9. Mark complete with PUT /api/progress/{studentId} as /llms.txt
     describes. Then start "write-your-first-post".
---

# Create your blog

You'll create a blog from EmDash's blog template, or reopen the blog you made in Publish a website, and run it on your own computer. Local changes stay on your computer until you deploy.

## What gets created

- **An Astro site** with a blog design, a home page, post pages, and tags.
- **An admin panel** at `/_emdash/admin/`, where you write and edit.
- **A Cloudflare setup** in `wrangler.jsonc`: one Worker for the site, a D1 database for your posts, and an R2 bucket for your images. On your computer these are simulated. When you deploy, Cloudflare creates the real ones.

You'll pick the name your blog's resources use, and you'll see the config that names them before anything is saved.

## Keep your key safe

EmDash writes a secret key to `.env`. It encrypts secrets saved by plugins. Back it up with your site's other backups, and never put it in git. If you lose it, those saved secrets can't be read again.
