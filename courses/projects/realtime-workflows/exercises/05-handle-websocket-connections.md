---
description: "Handle WebSocket connections, save Workflow progress, and replay it to new subscribers."
agent-instructions: |
  Goal: Broadcast live Workflow progress, save the latest snapshot, and
  replay it when a browser connects.
---

# Handle WebSocket connections

Each job's [Durable Object](https://developers.cloudflare.com/durable-objects/) will manage its [WebSocket](https://developers.cloudflare.com/workers/runtime-apis/websockets/) connections, broadcast progress updates, and save the latest status. Saving that status lets a browser connect late or refresh without waiting for the [Workflow](https://developers.cloudflare.com/workflows/) to publish another update.

In this lesson, you'll:

- add WebSocket support to the Durable Object
- define the `update` method to send real-time updates
- route WebSocket requests from the Worker to the Durable Object

## Accept a WebSocket connection

Add this `fetch()` method inside of the `ProgressRoom` class to handle promoting the incoming request to a WebSocket connection:

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

  const { 0: client, 1: server } = new WebSocketPair();
  this.ctx.acceptWebSocket(server);
  return new Response(null, { status: 101, webSocket: client });
}
```

`WebSocketPair` creates both ends of the connection. Your object keeps the server end, and the `101` response returns the client end to the browser.

`this.ctx.acceptWebSocket()` uses the WebSocket Hibernation API instead of `server.accept()`. This lets an idle object leave memory while its connections stay open. Duration charges don't accrue during hibernation. Read [Use WebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/) for more details.

### Handle connection events

You'll also need to add a few methods to the Durable Object to handle a few different events. Add these methods inside the same class:

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

These browsers only receive progress. A browser that sends a message gets a policy-violation close. The other handlers close connections when they end or encounter an error.

For more context, [Hibernation API example](https://developers.cloudflare.com/durable-objects/examples/websocket-hibernation-server/) explains how the runtime delivers these events.

## Broadcast a progress snapshot

The starter code already defines a `ProgressUpdate` type to use for sending updates:

- `jobId` - id of the job that produced the update
- `stageIndex` - current stage, starting at zero
- `completedStages` - number of finished stages, from zero to four
- `status` - `running`, `complete`, or `failed`
- `message` - human readable text for the user

Import that type at the top of `src/progress-room.ts`:

```ts title="src/progress-room.ts"
import type { ProgressUpdate } from "./progress";
```

Then add a public `update()` method inside the class to handle sending updates through the WebSocket connections:

```ts title="src/progress-room.ts"
async update(update: ProgressUpdate): Promise<void> {
  const message = JSON.stringify(update);
  for (const socket of this.ctx.getWebSockets()) {
    try {
      socket.send(message);
    } catch {
      console.warn({ event: "progress_delivery_failed", jobId: update.jobId });
    }
  }
}
```

`this.ctx.getWebSockets()` retrieves the object's accepted connections, including those kept open during hibernation. You don't need to maintain an in-memory socket list manually.

## Route browsers to the right room

In your Worker's `/api/progress` handler, forward the incoming request to the Durable Object by calling it's `fetch()` method and returning the result:

```ts title="src/index.ts"
if (url.pathname === "/api/progress") {
  const jobId = url.searchParams.get("jobId");
  if (!jobId) {
    return Response.json({ error: "Missing job ID." }, { status: 400 });
  }

  const room = env.PROGRESS_ROOM.getByName(jobId);
  return room.fetch(request);
}
```

## Publish updates from the Workflow

The last piece of the puzzle is to connect the Workflow to the Durable Object for sending the status updates. Inside of the Workflow, you can get a reference to its associated Durable Object based on the `jobId`. The `jobId` becomes the `instanceId` of the Workflow and is accessible via `event.instanceId`. Originally, you passed this property in the call to `JOB_WORKFLOW.create()`.

At the start of `run()` method in `src/workflow.ts`, before the stage loop, get a reference to the Durable Object like so:

```ts title="src/workflow.ts"
const room = this.env.PROGRESS_ROOM.getByName(event.instanceId);
```

### Publish before each stage

Inside of the main `step.do`, publish progress before returning its result:

```ts title="src/workflow.ts"
await step.do(`run ${stage.id}`, async () => {
  await room.update({
    jobId: event.instanceId,
    stageIndex: index,
    completedStages: index,
    status: "running",
    message: stage.message,
  });
  return { stage: stage.id, prompt: event.payload.prompt };
});
```

Calling `room.update()` invokes the object's method through [RPC](https://developers.cloudflare.com/workers/runtime-apis/rpc/). It is a server-to-server call through the binding, so the Workflow doesn't need an HTTP URL for the room. Awaiting it publishes the message before the work step returns.

### Publish completion

After the loop and before the existing return value, add:

```ts title="src/workflow.ts"
await step.do("publish completion", async () => {
  await room.update({
    jobId: event.instanceId,
    stageIndex: stages.length - 1,
    completedStages: stages.length,
    status: "complete",
    message: "All stages finished. Your background job is complete.",
  });
});
```

## Save the latest progress

One thing that hasn't been considered yet. A user might try to connect to an already running job. Either they refresh the browser or they open a tab for a job someone else created. Regardless, the use case you need to consider is how to publish the current status message of a working job on new connections.

To do this, you'll need to update the backend to save the current status each time it's updated. Since Durable Objects have durable storage, this is a perfect place to store that information. Every job can use the key `latest` to store that status.

### Read and write a snapshot

To save state, you can use the [key-value storage API](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/#asynchronous-kv-api) in the Durable Object to save a key/value pair. Inside of `ProgressRoom` in `src/progress-room.ts` at the beginning of the `update()` method.

```ts title="src/progress-room.ts"
await this.ctx.storage.put("latest", update);
```

Then, add this helper method for getting the latest status:

```ts title="src/progress-room.ts"
getLatest(): Promise<ProgressUpdate | undefined> {
  return this.ctx.storage.get<ProgressUpdate>("latest");
}
```

## Replay progress on connection

To ensure each new WebSocket connection gets the latest results, you need to send the latest status when they connect. In `ProgressRoom.fetch()`, immediately after `this.ctx.acceptWebSocket(server)`, query the latest status and send that snapshot if one exists:

```ts title="src/progress-room.ts"
const latest = await this.getLatest();
if (latest) {
  server.send(JSON.stringify(latest));
}
```

New subscribers receive the saved state when it's available. If there isn't a snapshot yet, the connection stays open and receives future updates through `update()`.
