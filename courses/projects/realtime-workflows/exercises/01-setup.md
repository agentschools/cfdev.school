---
description: "Clone the supplied React app, install its dependencies, and check that it runs locally."
agent-instructions: |
  Check the student's Node.js and pnpm versions against the prerequisites in COURSE.md. Ask which parent directory they want to use, then clone the starter there. Explain each command before running it and wait for the student's go-ahead before cloning or starting the server.

  1. Clone the main branch of https://github.com/jamesqquick/realtime-workflows-demo, install with `pnpm install --frozen-lockfile`, and start the dev server with `pnpm dev`.
  2. Check `/api/health` at the local URL printed by the dev server. Confirm the response contains `"ok": true`; the response may include a `project` label too. If the request fails, diagnose it before moving on.
  3. Mark complete through this school's progress API for course realtime-workflows, exercise setup, only after the local app starts and the health check succeeds. Use the student's ID and your harness ID.
---

# Set up the starter

The starter already includes the React interface, the job form, the progress display, and a Worker health endpoint. You'll add the Workflow, Durable Object, and WebSocket message handling in the next exercises.

## Check the prerequisites

The starter supports Node.js `^22.23.0`, `^24.22.0`, or `>=26.12.0`, and uses pnpm 11.9 or newer. Check your installed versions from a terminal:

```bash
node --version
pnpm --version
```

The `cf` CLI is pinned as a project dependency, so you don't need to install it globally.

## Clone and install

From the parent directory where you want the project, clone the starter's `main` branch:

```bash
git clone --branch main https://github.com/jamesqquick/realtime-workflows-demo
cd realtime-workflows-demo
```

Install the dependencies from the lockfile:

```bash
pnpm install --frozen-lockfile
```

## Run the starter

Start the local development server:

```bash
pnpm dev
```

The command prints the local URL. In another terminal, request the health endpoint at that URL. With the default Vite port, the command is:

```bash
curl http://localhost:5173/api/health
```

The JSON response should contain `"ok": true`. The starter also returns a `project` label; it is descriptive response data, not the Worker name in `cloudflare.config.ts`.
