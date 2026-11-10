---
description: "Handle incoming WebSocket messages in the supplied UI, then try refreshes and shared job links."
agent-instructions: |
  Goal: Add the WebSocket message handler in app/use-job-progress.ts.
---

# Connect the browser

Now that you have the server side taken care of, it's time to make the final changes on the frontend. In this lesson, you'll add one message handler to connect those updates to React state.

## Review the supplied connection

Open `app/use-job-progress.ts`. This React hook connects to the [WebSocket](https://developers.cloudflare.com/workers/runtime-apis/websockets/) at `/api/progress?jobId=...`, using `ws:` locally and `wss:` on HTTPS. Changing jobs or clicking Reconnect opens a new socket and cleans up the old one.

`app/App.tsx` already uses this hook to display the job's stages, percentage, message, and connection state. Opening a shared link or refreshing subscribes to the ID in the URL.

Before adding the handler, predict what should happen if you refresh halfway through a job. Where will the first progress message come from? Discuss your answer with your agent.

## Handle incoming progress

In `app/use-job-progress.ts`, replace the comment marking where to add `socket.onmessage` with:

```ts title="app/use-job-progress.ts"
socket.onmessage = (event) => {
  if (!active) return;
  const update = JSON.parse(event.data) as ProgressUpdate;
  if (update.jobId !== jobId) return;
  setProgress(update);
  if (update.status !== "running") {
    terminal.current = true;
    setConnection(update.status === "complete" ? "Complete" : "Failed");
    socket.close(1000, "Job finished.");
  }
};
```

- the `active` check ignores late events from a subscription the hook has already cleaned up.
- the `jobId` check confirms the status is for the correct job
- `setProgress(update)` updates React state
- `terminal.current` records that the job has finished before closing the socket

The server and browser share `ProgressUpdate`. The type assertion describes the expected JSON; it doesn't validate incoming data at runtime.

## Check the result

Open the app in the browser

1. Start a job and watch for status changes until the bar reaches 100%
2. Start another job and refresh after progress appears. It should load with the saved snapshop from the existing job and continue to work.
3. Open that job link in another tab which should show the matching status
