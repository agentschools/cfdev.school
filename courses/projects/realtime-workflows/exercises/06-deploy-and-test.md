---
description: "Deploy your app to Cloudflare and verify real-time progress on the live URL."
agent-instructions: |
  Goal: Deploy the existing app and verify live progress, refresh recovery,
  shared job links, and saved-state replay on the deployed URL.

  1. Mark complete through this school's progress API for course
     realtime-workflows, exercise deploy-and-test, only after deployment and
     the live checks succeed. Use the student's ID and your harness ID.
---

# Deploy and test

In this exercise, you're going to:

- deploy the [Worker](https://developers.cloudflare.com/workers/), [Workflow](https://developers.cloudflare.com/workflows/), and [Durable Object](https://developers.cloudflare.com/durable-objects/)
- verify real-time progress, refresh recovery, and shared job links on the deployed app

## Authenticate and deploy

First, you need to sign in to your Cloudflare account using the `cf` CLIby running the following command completing the steps in the browser:

```bash
pnpm exec cf auth login
```

If you're already logged in, you can confirm which account you're logged in as by running:

```bash
pnpm exec cf auth whoami
```

Then, run the local checks:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Once the checks pass and you have confirmed the account, deploy from your working app directory:

```bash
pnpm deploy
```

Open the deployment URL printed by the CLI.

## Check the result

With the project deployed, you can now test it. On the deployed page, start a new job and check that you see the experience you had when running locally.

- real-time updates showing for active jobs
- refreshing the pages or opening in a new tab loads the latest status

Your app is now deployed, with the Worker starting jobs, the Workflow publishing progress through the Durable Object, and the browser receiving updates over WebSockets.
