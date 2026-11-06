---
description: "Sync the project to GitHub and identify its stack and backend connection."
agent-instructions: |
  Follow the interview's app and scope throughout, using a disposable copy and synthetic records. Adapt book names, row counts and policies to that app. Verify all selected data, relationships and sequences. Pause if CSV cannot preserve them. Document retained services and verify their integrations; code deployment alone doesn't complete data migration.

  1. Help the student use Lovable's GitHub connection to sync to a repository they control. Clone it, inspect package.json and the lockfile, and install with its matching package manager. Don't commit exports, private credentials, or local environment files. Review tracked environment files; public publishable keys are distinct from private service keys.
  2. Identify TanStack Start (@tanstack/react-start) versus older React + Vite, the database client, migration layout, and all backend URL/key references. Read the official sources linked below. Inventory server code and dependencies; if there are extra backend services, remove them from this lab or stop and explain the scope difference.
  3. Create a migration branch separate from Lovable's active sync branch. Record the source commit and source project ID, without secrets. Explain two-way sync and why a branch still shares the old database until reconfigured. Ask the student to point out that URL before running the app; wait for their reply.
  4. Run locally using the existing scripts and confirm the three source records appear. Check there are no private credentials in client code. Preserve the original app and database throughout the lab.
  5. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes.
---

# Own the code

Using your own app? Keep its schema and features. Your agent adapts these checks to your agreed scope; the book names and three rows below describe the reading-list path. Some services may remain on the original backend, and your migration notes should say which.

Connect [Lovable to GitHub](https://docs.lovable.dev/integrations/github), then run a clone on your computer. Git sync works in both directions on the active branch. We'll make migration changes on a separate branch to leave the original preview alone.

Look inside the project with your agent. Where are the schema migrations? Where does the app choose its database? Source files are portable, but they can still point at the original backend.

[Current Lovable apps use TanStack Start](https://docs.lovable.dev/tips-tricks/deployment-hosting-ownership); older apps use React + Vite. Check the actual dependencies. A server-rendered app needs its server deployed as well as its browser assets.
