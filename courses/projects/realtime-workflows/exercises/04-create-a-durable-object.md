---
description: "Add a SQLite-backed Durable Object export and a typed binding for per-job progress."
agent-instructions: |
  Ask the student what state needs to survive a Worker request ending or a browser reconnect, and wait for their answer. Explain why each job needs its own Durable Object before editing the config.

  1. Create `ProgressRoom` in `src/progress-room.ts` as a `DurableObject<Env>` subclass.
  2. Add a SQLite-backed `ProgressRoom` export and a `PROGRESS_ROOM` binding in `cloudflare.config.ts`, then export the class from `src/index.ts`.
  3. Run `pnpm typecheck` and `pnpm lint`. Show how `getByName(jobId)` selects the same room for every request with that job ID.
  4. Mark complete through this school's progress API for course realtime-workflows, exercise create-a-durable-object, only after typecheck and lint pass. Use the student's ID and your harness ID.
---

# Create a Durable Object

The Workflow can run for longer than an HTTP request, and a browser may connect or reconnect while it is running. A [Durable Object](https://developers.cloudflare.com/durable-objects/) gives each job a stable place to coordinate its progress and connected browsers.

## Define the room

Create `src/progress-room.ts` and define a class that extends Cloudflare's `DurableObject` base class:

```ts title="src/progress-room.ts"
import { DurableObject } from "cloudflare:workers";

export class ProgressRoom extends DurableObject<Env> {}
```

The Worker and Workflow will call methods on this class through a binding. A call such as `getByName(jobId)` addresses the same object for the same job ID, so the Worker and Workflow can coordinate without a public URL.

## Export and bind the room

In `cloudflare.config.ts`, add a SQLite-backed class export beside `JobWorkflow`:

```ts title="cloudflare.config.ts"
exports: {
  JobWorkflow: exports.workflow({ name: workflowName }),
  ProgressRoom: exports.durableObject({ storage: "sqlite" }),
},
```

Add its binding under `worker.env`, beside `JOB_WORKFLOW`:

```ts title="cloudflare.config.ts"
PROGRESS_ROOM: bindings.durableObject({
  worker: app,
  exportName: "ProgressRoom",
}),
```

Export the class from `src/index.ts`:

```ts title="src/index.ts"
export { ProgressRoom } from "./progress-room";
```

Run `pnpm typecheck`. Its script runs `cf workers types` before TypeScript, regenerating the `Env` bindings from `cloudflare.config.ts`. Then run `pnpm lint`.

## Where you'll use this

The next exercise adds WebSocket handling and a `ProgressUpdate` snapshot to `ProgressRoom`. The Workflow will call `PROGRESS_ROOM.getByName(event.instanceId)` to publish updates for the job it is running.
