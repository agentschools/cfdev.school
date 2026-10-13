---
description: "Connect clients to a room over WebSockets, broadcast every message to everyone in it, and let the room sleep between messages without dropping anyone."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on the `Room` class from "store-data-with-sql"; check GET /api/progress/{studentId} first. Teach as you go, pitched to their interview answers (GET /api/students/{id}/interviews). For students who've built real-time features elsewhere, compare to running a WebSocket server and a pub/sub service like Redis so that clients connected to different servers still hear each other.

  1. Accept WebSockets in the room: give `Room` a `fetch(request)` method that creates a `new WebSocketPair()`, calls `this.ctx.acceptWebSocket(server)` on the server end, and returns `new Response(null, { status: 101, webSocket: client })`. `acceptWebSocket` is the Hibernation WebSocket API, which Cloudflare recommends over `server.accept()` (https://developers.cloudflare.com/durable-objects/best-practices/websockets/).
  2. Handle messages: add `async webSocketMessage(ws, message)` to `Room`. Parse it as JSON `{ author, text }` and pass it to `post()`. Then change `post()` so that after inserting the row, it sends the message as JSON to every socket in `this.ctx.getWebSockets()`. Now a message posted over HTTP or over a WebSocket reaches everyone connected.
  3. Route upgrades to the room: in the `/room` route, if the request has an `Upgrade: websocket` header, return `room.fetch(request)`, so the Worker hands the connection to the room's object.
  4. Try it with `cf dev`, then deploy with `cf deploy`.
  5. Verify before completing. YOU must, against the deployed URL (`wss://` instead of `https://`):
     - open two WebSocket connections to `/room?name=lobby` at the same time (Node.js 22 and newer have a global `WebSocket`; write a short script), send `{ "author": "...", "text": "..." }` from the first, and confirm both connections receive it;
     - `GET /room?name=lobby` and confirm the message was also stored.
     Then show the student how to try it themselves, e.g. with two terminals running the script, or `npx wscat -c wss://<url>/room?name=lobby` in each. Don't trust the student saying it worked.
  6. Teach the point, using what they just saw:
     - The room's object is the meeting point. Both connections went to the same object because they asked for the same name, so it can send to everyone directly. With plain Workers, two clients would likely land on different machines with no way to reach each other, which is why WebSocket apps usually need a pub/sub service on the side.
     - With `acceptWebSocket`, an idle room can be evicted from memory while its connections stay open. It wakes up when the next message arrives, and Cloudflare doesn't charge duration while it sleeps (https://developers.cloudflare.com/durable-objects/best-practices/websockets/). Anything kept in plain class fields is lost when it sleeps; per-connection data like a username goes in `ws.serializeAttachment()`.
     - This school uses the same pattern: when their agent marks an exercise complete, the open Dev School tab updates through a Durable Object holding a hibernatable WebSocket per browser.
     - What they've built across the course: one object per name, correct under concurrency, with its own database, that clients can stay connected to. That's the core of chat rooms, multiplayer games, collaborative documents, and AI agents with memory (Cloudflare's Agents SDK is built on Durable Objects).
  7. Comprehension check: ask the student why the room needs to be a Durable Object, instead of having the Worker keep a list of connected sockets in a variable. Gently correct anything off.
  8. Clean up, with the student's OK: delete the Worker with `cf workers delete <name> --force` (it prompts and aborts when run non-interactively without `--force`), which also removes its Durable Object namespaces and their data, and delete the KV namespace from "no-lost-updates" with `cf kv namespaces delete <id> --force` (find the ID with `cf kv namespaces list`). Skip this if they want to keep building on it.
  9. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes. This is the last exercise in the course. Suggest what's next: another fundamentals course, or a project that builds on Durable Objects.

  Out of scope here: auto-responses for pings (`setWebSocketAutoResponse`), alarms, authentication for who can join a room, the Agents SDK itself, and browser front ends.
---

# Talk in real time

Your room stores messages, but nobody finds out about a new one unless they ask. Real-time apps keep a connection open so the server can push updates the moment they happen.

Because every client asking for the same room reaches the same Durable Object, the room can hold all of their connections and send each new message to everyone.

## What you'll build

[WebSocket](https://developers.cloudflare.com/durable-objects/best-practices/websockets/) support for `Room`: clients connect to `/room?name=lobby`, and every message, sent over a WebSocket or posted over HTTP, is stored and pushed to everyone in the room. Between messages, the room can sleep without dropping anyone.

## Prerequisites

- You've completed [Store data with SQL](/courses/durable-objects/store-data-with-sql) and still have that Worker on disk.
- [Node.js](https://nodejs.org/) 22 or newer, for a quick WebSocket test script.
