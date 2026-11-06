---
description: "Point the exported app at the new database and deploy it to Workers."
agent-instructions: |
  Follow the interview's app and scope throughout, using a disposable copy and synthetic records. Adapt book names, row counts and policies to that app. Verify all selected data, relationships and sequences. Pause if CSV cannot preserve them. Document retained services and verify their integrations; code deployment alone doesn't complete data migration.

  1. Ask the student to review the change from source project URL to destination project URL and predict what data will appear. Wait for their reply. Set the destination URL and publishable key wherever the generated app actually reads them, including build-time variables if applicable. Never expose a service-role key or database password. Supabase's HTTP API needs no Hyperdrive binding.
  2. Adapt the existing app using the official framework and cf project guides below. Inspect cf --help and the installed packages before choosing commands or config. Use cf and cloudflare.config.ts per Agent setup. Don't run cf init over the export or replace its application code with a new demo. For TanStack Start, reconcile Lovable's Nitro adapter with the Cloudflare Vite integration, using only one deployment adapter; deploy server code and assets. For older Vite apps, preserve client routing fallback. If the current adapter/CLI combination isn't supported, stop here and report the exact incompatibility rather than claiming a deployment worked.
  3. Run the adapted build and local preview. Confirm all imported records render and reads use the destination. Search application code and generated client assets for the source project URL, and correct remaining runtime references. Keep the original source configuration available outside the release branch.
  4. Show the student the relevant config and wait for their review before deploying to a temporary Workers URL with the installed cf CLI. Do not switch a custom domain or provision paid add-ons. Fetch that URL yourself: verify titles and read states, direct nested routes if present, and server rendering/server functions if used. Inspect network responses if data loads only in the browser; a successful HTML status alone doesn't prove the database works.
  5. Ask which parts now run on Cloudflare and which still run at Supabase. Wait and correct any confusion about where PostgreSQL runs.
  6. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes.
---

# Deploy the app

Using your own app? Keep its schema and features. Your agent adapts these checks to your agreed scope; the book names and three rows below describe the reading-list path. Some services may remain on the original backend, and your migration notes should say which.

Your code is in GitHub and the books are in a new database. Now connect them and run the app on Workers.

Your agent will adapt the exported project using [Cloudflare's TanStack Start guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/) and the [cf project guide](https://developers.cloudflare.com/cf/projects/). Keep the app you built. Newer Lovable exports include server code, so copying static files alone won't run the whole application.

Use the new Supabase project URL and publishable key. A publishable key is intended for the client; database policies control what that client can do. Private service keys bypass those policies and must stay out of the app.

Before deploying, review the connection and configuration changes with your agent. On the temporary Workers URL, check the imported books and their states. Refresh the page and open any nested route directly.
