---
description: "Start a Workflow asynchronously and query its status by job ID."
agent-instructions: |
  Ask the student to predict what the `POST /api/jobs` request should return while the Workflow continues to run, and wait for their answer. Explain the request path and the difference between accepting a job and finishing it.

  1. Implement the `POST /api/jobs` handler in `src/index.ts` so it creates a unique job ID, starts `env.JOB_WORKFLOW` with that ID and the parsed `JobParams`, and returns the ID with HTTP 202.
  2. Implement `GET /api/jobs/:id` by getting the Workflow instance and returning its status with the job ID.
  3. Run `pnpm typecheck`, `pnpm lint`, and the local dev server. Start a job with the documented curl request, then query its status using the returned ID. Explain any `queued`, `running`, `waiting`, or terminal status the student sees.
  4. Mark complete through this school's progress API for course realtime-workflows, exercise start-a-workflow, only after POST returns 202 with a job ID and GET returns that job's Workflow status. Use the student's ID and your harness ID.
---

# Start a Workflow

The app's form already sends `POST /api/jobs`, and the Worker has a stub that returns `501`. You'll start a Workflow for each request and return its ID right away. A later request can use that ID to ask the Workflow for its current status.

## Start a job

In the `POST /api/jobs` branch in `src/index.ts`, read the request body as the existing `JobParams` type, create a unique ID, and start the Workflow:

```ts title="src/index.ts"
const params = (await request.json()) as JobParams;
const jobId = crypto.randomUUID();
await env.JOB_WORKFLOW.create({ id: jobId, params });
return Response.json({ jobId }, { status: 202 });
```

The request waits for the Workflow instance to be created, not for all 4 stages to finish. HTTP `202 Accepted` means the job was accepted for processing; it does not mean the job is complete.

## Query a job's status

The starter already matches paths like `/api/jobs/<id>`. In its `GET` branch, get the Workflow instance and return the `status` field from `instance.status()`:

```ts title="src/index.ts"
const jobId = jobStatusPath[1];
const instance = await env.JOB_WORKFLOW.get(jobId);
const { status } = await instance.status();
return Response.json({ jobId, status });
```

Workflow status values include states such as `queued`, `running`, `waiting`, `complete`, and `errored`. The `status` here describes Workflow execution; the app's progress updates will have their own status shape.

## Try the endpoints

With `pnpm dev` still running, start a job:

```bash
curl -i -X POST http://localhost:5173/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Draft a welcome post for my blog"}'
```

Copy the returned `jobId` and query it:

```bash
JOB_ID="paste-the-returned-job-id"
curl "http://localhost:5173/api/jobs/$JOB_ID"
```

Because each simulated stage takes 2 seconds, the Workflow may still be running when you check, or it may already be complete. In either case, the status is tied to that specific job ID.

## Where you'll use this

The next exercise adds a per-job Durable Object. It will store progress snapshots and serve the WebSocket connection for that same job ID.
