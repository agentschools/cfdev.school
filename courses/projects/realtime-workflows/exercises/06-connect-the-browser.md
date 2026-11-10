---
description: "Apply incoming WebSocket snapshots to the supplied React progress UI."
agent-instructions: |
  Ask the student where the initial progress snapshot should come from when a browser opens a job link late or refreshes, and wait for their answer. Explain the incoming message shape and stale-connection guard before editing the hook.

  1. Complete the `socket.onmessage` handler in `app/use-job-progress.ts`, adding a local `terminal` flag and guarding the open/close handlers so a completed socket is not shown as disconnected.
  2. Run `pnpm typecheck`, `pnpm lint`, and `pnpm test`.
  3. In the browser, start a job and verify live stages, refresh during a running job, and open the same job URL in another tab to verify snapshot replay and shared progress.
  4. Mark complete through this school's progress API for course realtime-workflows, exercise connect-the-browser, only after the checks and browser scenarios succeed. Use the student's ID and your harness ID.
---

# Connect the browser

The starter's React hook already opens a WebSocket for the job ID in the URL and handles reconnecting. Its `socket.onmessage` handler is still a placeholder. You'll use each incoming `ProgressUpdate` to update the UI and close the connection cleanly when the job is complete or has failed.

## Handle incoming snapshots

In `app/use-job-progress.ts`, add `let terminal = false` beside the existing `let active = true`. Update the `socket.onopen` and `disconnected` checks to also require `!terminal`:

```ts title="app/use-job-progress.ts"
socket.onopen = () => {
  if (active && !terminal) setConnection("Live");
};
```

Replace the placeholder comment with the message handler:

```ts title="app/use-job-progress.ts"
socket.onmessage = (event) => {
  if (!active) return;
  const update = JSON.parse(event.data) as ProgressUpdate;
  if (update.jobId !== jobId) return;

  setProgress(update);
  if (update.status !== "running") {
    terminal = true;
    setConnection(update.status === "complete" ? "Complete" : "Failed");
    socket.close(1000, "Job finished.");
  }
};
```

Also update the existing `disconnected` callback:

```ts title="app/use-job-progress.ts"
const disconnected = () => {
  if (active && !terminal) setConnection("Disconnected");
};
```

The `active` flag ignores messages from a socket whose effect has been cleaned up. The job ID check prevents another job's snapshot from updating this view. `terminal` keeps the close event from replacing a successful or failed state with `Disconnected`. The type assertion describes the expected JSON; it does not validate it at runtime.

## Test reconnects and shared links

Run `pnpm typecheck`, `pnpm lint`, and `pnpm test`, then open the app from `pnpm dev`:

1. Start a job and watch the stage messages and progress bar update.
2. Start another job and refresh while it is running. The initial message should be the saved snapshot, followed by new updates.
3. Open the job link shown in the app in another tab. It should show the same saved progress and continue updating.
4. Let a job finish and confirm the connection state changes to `Complete`.

The server sends snapshots both when progress changes and when a socket connects. That's why a browser can catch up without polling the Worker.
