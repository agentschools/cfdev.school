---
description: "Store and broadcast progress snapshots, accept WebSockets, and publish updates from the Workflow."
agent-instructions: |
  Ask the student to predict what progress a browser should receive when it opens a job link halfway through the job. Wait for their answer. Work through the Durable Object, Worker routes, and Workflow in small changes, explaining each before editing.

  1. Add `update()` and `getLatest()` to `ProgressRoom`, storing each snapshot and broadcasting it to accepted sockets.
  2. Add the Hibernation WebSocket `fetch()` and connection event handlers. Route `/api/progress?jobId=...` from the Worker to the matching room.
  3. Initialize a running snapshot before creating each Workflow, return the latest snapshot from `GET /api/jobs/:id`, and update the Workflow to publish each stage, completion, and failure through RPC.
  4. Run `pnpm typecheck`, `pnpm lint`, and `pnpm test`. Start a local job and verify `GET /api/jobs/:id` returns its latest progress snapshot as well as its Workflow status.
  5. Mark complete through this school's progress API for course realtime-workflows, exercise handle-websocket-connections, only after the checks and local progress request succeed. Use the student's ID and your harness ID.
---

# Handle WebSocket connections

The Durable Object will keep the newest progress snapshot and broadcast updates to its WebSocket connections. It will also send the saved snapshot when a browser connects, so a refresh or shared job link does not have to wait for the next Workflow stage.

## Store and broadcast snapshots

Import the existing `ProgressUpdate` type from `src/progress.ts`. Add these methods to `ProgressRoom`:

```ts title="src/progress-room.ts"
async update(update: ProgressUpdate): Promise<void> {
  const previous = await this.getLatest();
  if (
    previous &&
    (previous.status !== "running" ||
      update.completedStages < previous.completedStages)
  ) {
    return;
  }

  await this.ctx.storage.put("latest", update);
  const message = JSON.stringify(update);
  for (const socket of this.ctx.getWebSockets()) {
    try {
      socket.send(message);
    } catch {
      console.warn({ event: "progress_delivery_failed", jobId: update.jobId });
    }
  }
}

getLatest(): Promise<ProgressUpdate | undefined> {
  return this.ctx.storage.get<ProgressUpdate>("latest");
}
```

The latest snapshot is stored in the Durable Object's SQLite-backed storage. `getWebSockets()` returns the accepted sockets, including ones that stayed connected while the object hibernated. The guard ignores progress that arrives after a terminal snapshot or tries to move progress backwards.

## Accept and replay WebSocket connections

Add a `fetch()` method to `ProgressRoom`. It accepts only a WebSocket upgrade, looks up the snapshot, then accepts and sends the snapshot to the new connection:

```ts title="src/progress-room.ts"
async fetch(request: Request): Promise<Response> {
  if (
    request.method !== "GET" ||
    request.headers.get("Upgrade")?.toLowerCase() !== "websocket"
  ) {
    return Response.json(
      { error: "Expected a WebSocket connection." },
      { status: 426 },
    );
  }

  const latest = await this.getLatest();
  if (!latest) {
    return Response.json({ error: "Job not found." }, { status: 404 });
  }

  const { 0: client, 1: server } = new WebSocketPair();
  this.ctx.acceptWebSocket(server);
  server.send(JSON.stringify(latest));
  return new Response(null, { status: 101, webSocket: client });
}
```

`acceptWebSocket()` uses the Durable Object Hibernation WebSocket API, so an idle object can leave memory without disconnecting its clients. Add handlers for the client lifecycle; the progress socket is read-only:

```ts title="src/progress-room.ts"
webSocketMessage(socket: WebSocket): void {
  socket.close(1008, "Progress connections are read-only.");
}

webSocketClose(socket: WebSocket): void {
  socket.close(1000, "Connection closed.");
}

webSocketError(socket: WebSocket): void {
  socket.close(1011, "Connection error.");
}
```

See Cloudflare's [Durable Object WebSocket guide](https://developers.cloudflare.com/durable-objects/best-practices/websockets/) for the Hibernation API and event handlers.

## Route progress requests to the room

The browser connects to `/api/progress?jobId=...`. In the matching branch in `src/index.ts`, keep the existing missing-ID check and forward the WebSocket request to the room:

```ts title="src/index.ts"
const room = env.PROGRESS_ROOM.getByName(jobId);
return room.fetch(request);
```

When creating a job, write its initial snapshot before starting the Workflow. This lets the browser connect immediately, before the next stage update:

```ts title="src/index.ts"
const room = env.PROGRESS_ROOM.getByName(jobId);
await room.update({
  jobId,
  stageIndex: 0,
  completedStages: 0,
  status: "running",
  message: "Your job is starting.",
});

await env.JOB_WORKFLOW.create({ id: jobId, params });
```

Update the `GET /api/jobs/:id` branch to read the snapshot and Workflow status. Return 404 if the room has no snapshot:

```ts title="src/index.ts"
const room = env.PROGRESS_ROOM.getByName(jobId);
const progress = await room.getLatest();
if (!progress) {
  return Response.json({ error: "Job not found." }, { status: 404 });
}

const instance = await env.JOB_WORKFLOW.get(jobId);
const { status } = await instance.status();
return Response.json({ jobId, status, progress });
```

## Publish progress from the Workflow

In `JobWorkflow.run()`, get the room using the Workflow instance ID. Replace the current method body with the version below. Each RPC update runs inside a named Workflow step, and the final step publishes completion. If a step fails, publish a failure snapshot and rethrow the error so the Workflow remains failed.

```ts title="src/workflow.ts"
async run(event: WorkflowEvent<JobParams>, step: WorkflowStep) {
  const room = this.env.PROGRESS_ROOM.getByName(event.instanceId);
  let stageIndex = 0;

  try {
    for (const [index, stage] of stages.entries()) {
      stageIndex = index;
      await step.do(`Executing ${stage.name}`, async () => {
        await room.update({
          jobId: event.instanceId,
          stageIndex: index,
          completedStages: index,
          status: "running",
          message: stage.message,
        });
      });

      await step.sleep(`simulate ${stage.id}`, "2 seconds");
    }

    await step.do("publish completion", async () => {
      await room.update({
        jobId: event.instanceId,
        stageIndex: stages.length - 1,
        completedStages: stages.length,
        status: "complete",
        message: "All stages finished. Your background job is complete.",
      });
    });

    return { prompt: event.payload.prompt, completedStages: stages.length };
  } catch (error) {
    await step.do("publish failure", async () => {
      await room.update({
        jobId: event.instanceId,
        stageIndex,
        completedStages: stageIndex,
        status: "failed",
        message:
          error instanceof Error
            ? error.message
            : "The workflow failed. Start another job to try again.",
      });
    });
    throw error;
  }
}
```

`room.update()` is an RPC call through the Durable Object binding; it does not need an HTTP URL. The progress payload contains the fields in `ProgressUpdate` from `src/progress.ts`.

Run `pnpm typecheck`, `pnpm lint`, and `pnpm test`. Start a job and query `GET /api/jobs/<id>` to see its saved progress. The next exercise connects the browser to the WebSocket and displays these same snapshots.
