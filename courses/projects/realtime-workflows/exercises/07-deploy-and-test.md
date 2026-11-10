---
description: "Deploy the Worker, Workflow, and Durable Object, then verify progress replay on the live app."
agent-instructions: |
  Explain that deployment creates Cloudflare resources in the student's account, and ask for confirmation before running it. Ask the student to use a non-sensitive prompt; anyone with a job URL can view its progress.

  1. Check the active Cloudflare account with `pnpm exec cf auth whoami`; if the student is not signed in, use `pnpm exec cf auth login`, then confirm the account again.
  2. Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`. Fix failures before deployment.
  3. After the student confirms the account and deployment, run `pnpm deploy`, open the URL printed by the CLI, and verify real-time updates, a refresh during a running job, and the same job in another tab.
  4. Mark complete through this school's progress API for course realtime-workflows, exercise deploy-and-test, only after deployment and all live checks succeed. Use the student's ID and your harness ID.
---

# Deploy and test

The app now runs a Workflow for each job, stores its newest progress snapshot in a Durable Object, and streams updates to the browser. Deploy it to Cloudflare and repeat the live progress checks.

## Confirm the account and run checks

The starter includes the `cf` CLI as a project dependency. Check the active account:

```bash
pnpm exec cf auth whoami
```

If you are not signed in, log in and check again:

```bash
pnpm exec cf auth login
pnpm exec cf auth whoami
```

Review the account shown before deploying. The deploy creates a Worker, a Workflow, and a Durable Object in that account.

Run the project's checks:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Deploy the app

After the checks pass and you have confirmed the target account, deploy:

```bash
pnpm deploy
```

Open the URL printed by the CLI. The app has no authentication; anyone with a job link can view that job's progress.

## Verify the live app

On the deployed URL:

1. Start a job and watch its progress through all 4 stages.
2. Start a new job, refresh while it is still running, and confirm that it resumes from the latest snapshot.
3. Open the same job link in another tab and confirm both tabs show the same progress.
4. Confirm that the job ends in `Complete` and the progress bar reaches 100%.

You have deployed a Worker that starts durable background jobs and a Durable Object that streams their progress to connected browsers.
