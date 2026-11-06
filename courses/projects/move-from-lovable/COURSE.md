---
name: move-from-lovable
description: "Move your Lovable app to Workers and a separate Supabase database, or start with a tiny shared reading list."
compatibility: "Requires Lovable and GitHub accounts, a separate Supabase project, Node.js 22.18 or later, and a Cloudflare account with the cf CLI from Agent setup. Check each provider's current limits and pricing before creating resources."
metadata:
  author: Cloudflare Dev School
---

# Move from Lovable to Cloudflare

Bring your existing Lovable app, or build a little shared reading list. The interview chooses which app you use throughout. For an existing app, first inspect its stack and dependencies and agree on a migration scope using a disposable copy with synthetic records. Keep services outside that scope on the original backend explicitly, or pause for a separate migration plan.

The reading-list path brings its code and existing books to accounts you control. Your app will run on Workers and read from a separate PostgreSQL database on Supabase. Friends can read the list; you edit it in the database dashboard. There's no sign-in or public write API in this first version.

You'll move three books, including their IDs and read states. At the end, changing a book in the new database updates the new app while the original stays unchanged.

[Lovable documents a migration path to Supabase](https://docs.lovable.dev/tips-tricks/external-deployment-hosting). We're using it because it preserves the database API and access policies with fewer changes. [PlanetScale is also a Cloudflare partner](https://developers.cloudflare.com/hyperdrive/planetscale/), with PostgreSQL through Hyperdrive; replacing Supabase services is a separate project. D1 would also require translating PostgreSQL to SQLite.

This course moves one application table and the app that reads it. User accounts, uploaded files, Edge Functions, jobs, AI, and connectors are outside this lab. Git sync copies source and migration files, while records and secrets move separately. Keep everything synthetic and keep exports out of Git.

You'll need access to Lovable's database tools and a new Supabase project. Its [free plan](https://supabase.com/pricing) has limits, inactivity pausing, and no automatic backups. Check [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) and Lovable credits too. Use a temporary Workers URL; no domain purchase is needed. Remove the lab resources when you're done.
