---
description: "Create a Workflow by defining the appropriate configuration and class."
agent-instructions: |
  Goal: setup blog generation Workflow including the configuration in cloudflare.config.ts and the Workflow implementation class.

  Follow the steps from the lesson in order while explaining what you're doing and why for each step before doing it. Make sure to pay extra attention to teaching the user about the Cloudflare products that are being used, explanations of the code snippet, and how everything comes together.

  1. Mark complete through this school's progress API for course
     realtime-workflows, exercise create-a-workflow, after the implementation
     passes pnpm typecheck and pnpm lint. Use the student's ID and your harness ID.
---

# Create a workflow

In this exercise, you're going to:

- add the [Workflow](https://developers.cloudflare.com/workflows/) configuration to `cloudflare.config.ts`
- update the `JobWorkflow` class to implement phase steps

## Setting up a Cloudflare workflow

In `cloudflare.config.ts`, update the imports from `"cf/config"` to include `bindings` and `exports`. Then, create the `workflowName` variable which dervies from `workerName`:

```ts title="cloudflare.config.ts"
import { bindings, defineConfig, defineWorker, exports } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

const workerName = "workflow-lab-starter";
const workflowName = `${workerName}-job`;
```

### Declare the workflow export

Add the `exports` property to `app` to declare that this Worker will export a Workflow class named `JobWorkflow`. You'll write that class in the next section.

```ts title="cloudflare.config.ts"
const app = defineWorker({
  name: workerName,
  compatibilityDate: "2026-11-03",
  entrypoint,
  exports: {
    JobWorkflow: exports.workflow({ name: workflowName }),
  },
});
```

The `JobWorkflow` key identifies the class exported by your code. `workflowName` names the Workflow resource. Keeping the Worker definition in `app` lets the binding below refer to it and check its export name through TypeScript.

### Make the workflow available through `env`

Inside `defineConfig()`, add an `env` object under `worker` with this binding:

```ts title="cloudflare.config.ts"
env: {
  JOB_WORKFLOW: bindings.workflow({
    name: workflowName,
    worker: app,
    exportName: "JobWorkflow",
  }),
},
```

`exports` declares the Workflow this Worker defines. The binding makes it available to your code as `env.JOB_WORKFLOW`, which your request handler will use to start jobs. Its `exportName` must match the `JobWorkflow` class export.

With those additions, your `defineConfig()` call looks like this:

```ts title="cloudflare.config.ts"
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
    },
    observability: {
      enabled: true,
      traces: { enabled: true },
    },
  },
});
```

See the [cf configuration reference](https://developers.cloudflare.com/cf/projects/cloudflare-config/) for more about exports and bindings.

## Update the workflow class

Now, you'll update the class for the Workflow and update its `run()` method which defines the work that will be executed when the Workflow gets triggered.

In `src/workflow.ts`, you'll see the`Workflow` class that extends `WorkflowEntrypoint` and implements `run()`.

- `event` contains the job's input including the prompt at `event.payload.prompt`
- `step` provides the methods for running and saving the results of individual steps
- `Env` describes the environment bindings
- `JobParams` describes the input passed to a job (defined in `src/progress.ts`)

### Implementing steps in run()

So far, the `run()` method doesn't actually do any actions. Instead, you want to run a step for each one of the 4 phases of blog post: research, outline, draft, and review. These phases are already defined in defined in `src/progress.ts`.

```ts
export const stages = [
  {
    id: "research",
    name: "Research",
    message: "Finding sources and useful ideas",
  },
  {
    id: "outline",
    name: "Outline",
    message: "Organizing the work into a clear plan",
  },
  { id: "draft", name: "Draft", message: "Putting the first version together" },
  { id: "review", name: "Review", message: "Checking the result" },
] as const;
```

Replace the body of the `run()` method with a loop over the `stages` array. Include the stage ID in each step name so you can distinguish between them. Each iteration runs one step, and each step can be retried if necessary

```ts title="src/workflow.ts"
for (const stage of stages) {
  await step.do(`run ${stage.id}`, async () => {
    return { stage: stage.id, prompt: event.payload.prompt };
  });
}

return {
  prompt: event.payload.prompt,
  completedStages: stages.length,
};
```

Awaiting each step keeps the stages in order. These steps currently return simulated results. The value returned by `run()` becomes the completed Workflow's output.

### Add a delay before each stage

Instead of implementing the actual logic for each phase, you'll add add `step.sleep()` immediately before `step.do()`. This simulates a stage taking time and will make progress updates easier to observe later.

```ts title="src/workflow.ts"
await step.sleep(`simulate ${stage.id}`, "2 seconds");
```

Each stage now waits two seconds before its work step runs.

After adding a bit of error handling and logging, the final `run` method should look like this:

```ts
async run(event: WorkflowEvent<JobParams>, step: WorkflowStep) {
    let stageIndex = 0;

    try {
      for (const [index, stage] of stages.entries()) {
        stageIndex = index;
        await step.do(`Executing ${stage.name}`, async () => {
          console.log(
            `Executing stage ${stage.name} for job ${event.instanceId}`,
          );
        });

        await step.sleep(`simulate ${stage.id}`, "2 seconds");
      }
      return { prompt: event.payload.prompt, completedStages: stages.length };
    } catch (error) {
      await step.do("publish failure", async () => {
        console.log(
          `Job ${event.instanceId} failed at stage ${stages[stageIndex].name}.`,
        );
      });
      throw error;
    }
  }
```

### Export the class from the Worker entrypoint

Export the class from `src/index.ts` so it matches the `JobWorkflow` export declared in your configuration. Add this alongside the existing request handler:

```ts title="src/index.ts"
export { JobWorkflow } from "./workflow";
```

Your Worker now declares the Workflow and exports its implementation. In later exercises, you'll add a [Durable Object](https://developers.cloudflare.com/durable-objects/) binding and publish progress updates.
