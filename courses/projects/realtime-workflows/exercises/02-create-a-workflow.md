---
description: "Declare a Workflow in the typed Cloudflare config and implement its durable steps."
agent-instructions: |
  The student has cloned the starter and completed the interview. Ask them to predict what should happen if a Workflow is interrupted during a stage, and wait for their answer before changing code. Explain the configuration and each code change before making it.

  1. Add the Workflow export and `JOB_WORKFLOW` binding in `cloudflare.config.ts`. Keep the starter's existing `workerName`; the `/api/health` response's `project` label is not the deploy name.
  2. Implement and export `JobWorkflow` in `src/workflow.ts` and `src/index.ts`. Use the existing 4 stages from `src/progress.ts`, a uniquely named `step.do()` for each, and `step.sleep()` to simulate the work.
  3. Run `pnpm typecheck` and `pnpm lint`, fixing any failures. Show the student the Workflow class and explain how the step names and saved results make the job durable.
  4. Mark complete through this school's progress API for course realtime-workflows, exercise create-a-workflow, only after typecheck and lint pass. Use the student's ID and your harness ID.
---

# Create a Workflow

The starter's `Workflow` class returns the job prompt without doing any work. You'll declare a Cloudflare Workflow and replace that placeholder with 4 named steps. Each step returns a small serializable result, and a 2-second sleep simulates work so the job stays active long enough to follow.

## Declare the Workflow

The starter already has a `workerName` and a `defineWorker()` call in `cloudflare.config.ts`. Keep the existing Worker name. Add `bindings` and `exports` to the import from `cf/config`, then derive a Workflow resource name from the existing Worker name:

```ts title="cloudflare.config.ts"
import { bindings, defineConfig, defineWorker, exports } from "cf/config";

const workflowName = `${workerName}-job`;
```

Declare the Workflow class in the `exports` property of the existing `defineWorker()` call:

```ts title="cloudflare.config.ts"
exports: {
  JobWorkflow: exports.workflow({ name: workflowName }),
},
```

In the `worker` object passed to `defineConfig()`, add an `env` property and put the Workflow binding inside it:

```ts title="cloudflare.config.ts"
env: {
  JOB_WORKFLOW: bindings.workflow({
    name: workflowName,
    worker: app,
    exportName: "JobWorkflow",
  }),
},
```

The export declares the Workflow class and resource. The binding makes it available to Worker code as `env.JOB_WORKFLOW`. Its `exportName` must match the class name you'll create next. See the [typed configuration reference](https://developers.cloudflare.com/cf/projects/cloudflare-config/) for the `exports` and `bindings` builders.

## Implement the Workflow steps

In `src/workflow.ts`, rename the starter's exported class to `JobWorkflow` and implement its `run()` method. The `stages` array in `src/progress.ts` already defines research, outline, draft, and review.

```ts title="src/workflow.ts"
import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import { type JobParams, stages } from "./progress";

export class JobWorkflow extends WorkflowEntrypoint<Env, JobParams> {
  async run(event: WorkflowEvent<JobParams>, step: WorkflowStep) {
    for (const stage of stages) {
      await step.do(`run ${stage.id}`, async () => ({
        stage: stage.id,
        prompt: event.payload.prompt,
      }));

      await step.sleep(`simulate ${stage.id}`, "2 seconds");
    }

    return { prompt: event.payload.prompt, completedStages: stages.length };
  }
}
```

`WorkflowEntrypoint` receives the job data through `event.payload`. Each `step.do()` has a stable name and returns serializable data that Workflows can persist. `step.sleep()` pauses the Workflow without keeping a request open; the named step can resume later.

Export the class from the Worker entrypoint so it matches the config:

```ts title="src/index.ts"
export { JobWorkflow } from "./workflow";
```

Run `pnpm typecheck` to regenerate the binding types and check the config, then run `pnpm lint`.

## Where you'll use this

The next exercise starts this Workflow from the Worker's `POST /api/jobs` handler. Later, the Workflow will publish each stage through a Durable Object.
