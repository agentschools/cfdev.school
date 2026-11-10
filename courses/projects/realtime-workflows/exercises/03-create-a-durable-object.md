---
description: "Create and configure a Durable Object for each job."
agent-instructions: |
  Goal: Create and configure a Durable Object for each job.
  Teaching points - explain how Durable Objects are a good fit for this solution
---

# Create a Durable Object

The previous exercise lets you ask whether a [Workflow](https://developers.cloudflare.com/workflows/) is running or complete. This works but requires manual polling for status updates. Instead, we want to send real-time updates to the browser as the status changes.

To implement this, you'll create a [Durable Object](https://developers.cloudflare.com/durable-objects/) for each job that gets created. The Durable Object's responsibility is to accept [WebSocket](https://developers.cloudflare.com/workers/runtime-apis/websockets/) connections and send those real-time updates to the client.

In this exercise, you're going to:

- create and configure a Durable Object for each job
- create method for publishing status updates

## Define the Durable Object class

To define a Durable Object, you need to create a class that extends `DurableObject`.
Create `src/progress-room.ts`, and add the `ProgressRoom` class:

```ts title="src/progress-room.ts"
import { DurableObject } from "cloudflare:workers";

export class ProgressRoom extends DurableObject<Env> {}
```

Inside of the `ProgressRoom` class, you define methods for the functionality you need. In this case, this is where we'll eventually create the method that will be called to send the status updates.

### Declare the export and binding

Now, you need to add the configuration for the Durable Object in `cloudflare.conig.ts`. This includes adding it to the export section as well as defining the binding name (`PROGRESS_ROOM`) and associating it with the name of the class you just created which is `ProgressRoom`.

Inside `cloudflare.config.ts` in the `defineWorker(...)`, add `ProgressRoom` alongside the existing Workflow export:

```ts title="cloudflare.config.ts"
exports: {
  JobWorkflow: exports.workflow({ name: workflowName }),
  ProgressRoom: exports.durableObject({ storage: "sqlite" }),
},
```

Then, add this binding beside `JOB_WORKFLOW` in `worker.env`:

```ts title="cloudflare.config.ts"
PROGRESS_ROOM: bindings.durableObject({
  worker: app,
  exportName: "ProgressRoom",
}),
```

The export declares the class and its storage backend. The binding gives your [Worker](https://developers.cloudflare.com/workers/) and Workflow access to that class through `env.PROGRESS_ROOM`. Referring to the typed `app` definition also lets TypeScript check the object's RPC methods.

The final result looks like this.

```ts
import { bindings, defineConfig, defineWorker, exports } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

const workerName = "workflow-lab-solution";
const workflowName = `${workerName}-job`;
const app = defineWorker({
  name: workerName,
  compatibilityDate: "2026-11-03",
  entrypoint,
  exports: {
    JobWorkflow: exports.workflow({ name: workflowName }),
    ProgressRoom: exports.durableObject({ storage: "sqlite" }),
  },
});

export default defineConfig({
  worker: {
    ...app,
    assets: {
      notFoundHandling: "single-page-application",
      runWorkerFirst: ["/api/*"],
    },
    env: {
      JOB_WORKFLOW: bindings.workflow({
        name: workflowName,
        worker: app,
        exportName: "JobWorkflow",
      }),
      PROGRESS_ROOM: bindings.durableObject({
        worker: app,
        exportName: "ProgressRoom",
      }),
    },
    observability: {
      enabled: true,
      traces: { enabled: true },
    },
  },
});
```

For the `ProgressRoom` class to be available to the Worker, you need to export from the Worker entrypoint (`./src/index.ts`), beside the existing `JobWorkflow` export:

```ts title="src/index.ts"
export { ProgressRoom } from "./progress-room";
```

Lastly, in each of the API handlers, you'll can get a reference to the Durable Object associated with the `jobId`.

```ts
const room = env.PROGRESS_ROOM.getByName(jobId);
```

WE'll use this `room` reference shortly. In the meantime, run `pnpm typecheck` to regenerate the binding types and check the configuration.
