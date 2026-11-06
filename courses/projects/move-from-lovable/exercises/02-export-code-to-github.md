---
description: "Export your Lovable app’s code to GitHub so you can deploy it to Cloudflare."
agent-instructions: |
  Follow the course's teaching approach and the steps below with the learner. Use their chosen app; don't replace it with the example. Independently verify the completion checks and pause on unsupported dependencies.
  1. Mark complete only after the page's checks pass, using the progress procedure in /llms.txt.
---

# Export code to GitHub

Code and data travel separately. A clone of your app can still read and write the original database.

1. Connect [Lovable to GitHub](https://docs.lovable.dev/integrations/github) and sync to a repository you control. If it's already synced, use that repository. Clone it, open your agent in the project directory, and install dependencies with the package manager matching its lockfile.
2. Inspect `package.json` together. [Newer Lovable apps use TanStack Start](https://docs.lovable.dev/tips-tricks/deployment-hosting-ownership), including server code; older apps use React + Vite. Identify the actual stack, database client and migration layout. Inventory server code and other dependencies against your agreed scope.
3. Locate every backend URL and key reference. Point out which project the app currently connects to before running it. Public publishable keys are intended for clients; service keys and database passwords must stay private. Keep exports and local environment files out of Git and review already-tracked configuration for secrets.
4. Create a migration branch separate from Lovable's active sync branch. Record the source commit and project ID without secrets. Git sync is two-way on the active branch; a new branch still shares the old backend until reconfigured.
5. Run locally with the existing scripts. Verify the comparison records appear, and inspect the code to confirm private credentials aren't sent to the browser. Preserve the original app and database.

Before continuing, explain which files define the schema and which connection still points at the source. Why hasn't the database moved yet?
