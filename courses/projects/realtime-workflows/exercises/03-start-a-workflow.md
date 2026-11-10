---
description: "Start a real multi-step Workflow from a Worker and return a job ID before it finishes."
agent-instructions: |
  Goal: setup blog generation Workflow and implement API functionality for POST to /api/jobs for creating a job and GET to /api/jobs/:id to get the status of a job by id.

  Teaching points - pay particular attention to explain the concept of asynchronous background jobs related to Cloudflare Workflows and the fact that the HTTP endpoint returns success after the job is kicked off while the job itself continues to run in the background.
---

# Start a workflow

In this exercise, you're going to:

- implement POST handler to start a job at `/api/jobs`
- implement GET handler to get the status of a job `/api/jobs/:id`

The `/api/jobs` endpoint will kick off the asynchronous job and return back an initial status and `jobId` while the job is running asynchronously behind the scenes. Then, subsequent requests to `/api/jobs/:id` include the `jobId` to query the status of that specific job.

## Implement `/api/jobs` POST handler

The starter code includes a stubbed out version of `/api/jobs`. It returns an error message to indicate the work you need to do. Test this by sending the following request:

```bash
curl http://localhost:5173/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Process a batch of images"}'
```

Now, implement the functionality to start the asynchronous job. To create a job for the `JOB_WORKFLOW` you've defined, you can reference the [workflow](https://developers.cloudflare.com/workflows/) on `env.`. Notice `JOB_WORKFLOW` matches the key you used in the Cloudflare config file. From here, you can call `.create()` like so:

```ts
const jobId = crypto.randomUUID();
await env.JOB_WORKFLOW.create({ id: jobId, params });
```

Update the handler in `src/index.ts`, to kick off the job and update the return value to return the `jobId` as well as a status of `202`. This status code indicates that the request was received but the background job has not been completed.

```ts title="src/index.ts"
if (request.method === "GET" && jobStatusPath) {
  const params = (await request.json()) as JobParams;
  const jobId = crypto.randomUUID();
  await env.JOB_WORKFLOW.create({ id: jobId, params });
  return Response.json({ jobId }, { status: 202 });
}
```

## Implement `/api/jobs/:id` GET handler

At this point, you have the ability to start a background job. Next, you'll need to update the `/api/jobs:id` handler to retrieve the status for a given job id. To get the status of a Workflow, you first query the Workflow instance and then call it's `status()` method:

```ts
const instance = await env.JOB_WORKFLOW.get(jobId);
const status = await instance.status();
```

Update the handler, to query the job by the id included in the url, and return the status and `jobId` back to the user.

```ts title="src/index.ts"
if (url.pathname.startsWith("/api/jobs/") && request.method === "GET") {
  const jobId = url.pathname.slice("/api/jobs/".length);
  const instance = await env.JOB_WORKFLOW.get(jobId);
  const status = await instance.status();
  return Response.json({ jobId, status: status.status });
}
```

## Check the result

At this point, you have the ability to start a background job and manual query its status. To kick off a job, run the following command in your terminal:

```bash
curl -X POST http://localhost:5173/api/jobs -H "Content-Type: application/json" -d '{"prompt":"Write an introduction to Cloudflare Workflows"}'
```

Take note of the returned `jobId`. Use that `jobId` to then make a request to the status endpoint like so:

```bash
curl http://localhost:5173/api/jobs/<JOB_ID>
```

You should a response the includes `jobId` and `status`.
