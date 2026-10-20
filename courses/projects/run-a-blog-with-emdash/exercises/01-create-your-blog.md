---
description: "Start a new EmDash blog on your computer and open its admin panel."
agent-instructions: |
  Read the student's interview for this course first (GET
  /api/students/{id}/interviews). If they already have an EmDash site from
  Publish a website, open that project instead of creating one, and still
  teach every step below.

  1. Ask the student for a short project name, lowercase with hyphens
     (suggest one from their blog's name). Wait for their reply.
  2. Create the blog with the blog template:

       npm create emdash@latest <name> -- --platform cloudflare --template blog --pm npm --install --no-sandboxed-plugins --yes

     Its wrangler.jsonc names the Worker, D1 database, and R2 bucket
     `my-emdash-site` and `my-emdash-media` no matter the folder name.
     Show the student those lines, explain that each is a Cloudflare
     resource the deploy will create, and rename all three to match their
     project. Wait for their OK before saving.
  3. It writes an EMDASH_ENCRYPTION_KEY to .env. Tell them to back it up
     somewhere safe and never commit it. Confirm .env is in .gitignore.
  4. Leave sandboxed plugins off: they need Worker Loader, which is on
     Workers Paid.
  5. This is a Wrangler project: it deploys with Wrangler, not cf. Add a
     short section to the project's AGENTS.md (EmDash creates one) with the
     stack, `npm run dev`, `npm run deploy`, and "this is a Wrangler
     project: don't run cf project commands here".
  6. Before you run `npm run dev`, ask the student what they expect to see
     at http://localhost:4321/. Wait for the answer. Then run it, and have
     them open http://localhost:4321/_emdash/admin/ and finish the local
     setup wizard.
  7. Verify before completing: fetch
     http://localhost:4321/_emdash/admin/ and confirm it loads, and read
     wrangler.jsonc to confirm no `my-emdash-site` or `my-emdash-media`
     names are left. Completion waits on both.
  8. Mark complete with PUT /api/progress/{studentId} as /llms.txt
     describes. Then start "write-your-first-post".
---

# Create your blog

You'll create a new blog from EmDash's blog template and run it on your own computer. Nothing is on the internet yet, so you can try things freely.

## What gets created

- **An Astro site** with a blog design, a home page, post pages, and tags.
- **An admin panel** at `/_emdash/admin/`, where you write and edit.
- **A Cloudflare setup** in `wrangler.jsonc`: one Worker for the site, a D1 database for your posts, and an R2 bucket for your images. On your computer these are simulated. When you deploy, Cloudflare creates the real ones.

You'll pick the name your blog's resources use, and you'll see the config that names them before anything is saved.

## Keep your key safe

EmDash writes a secret key to `.env`. It protects data your site stores. Back it up, and never put it in git. If you lose it, some saved settings can't be read again.
