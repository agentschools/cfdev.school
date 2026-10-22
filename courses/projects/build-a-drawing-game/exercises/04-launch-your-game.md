---
description: "Decide when the game guesses, check every request on the server, cap how many guesses it allows, and put it online for others to play."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on the game from "draw-and-guess"; check GET /api/progress/{studentId} first, and read the project's `AGENTS.md`. Teach the body's sections as you go, before the code that uses them. The numbers in the body were measured with an eight-word list; theirs will differ, which is why they measure their own.

  1. Measure what a guess costs. Show the student `usage.input_tokens` and `ms` from a few of their guesses, and work out the neurons per guess with the rates on https://developers.cloudflare.com/workers-ai/platform/pricing/ (Clef-flash's neurons per million input tokens), and how many guesses fit in the free 10,000 neurons a day. Then have them predict what sending the full 512×512 canvas instead would cost, and check it by sending one with `curl`.
  2. Ask the student to choose when the game guesses, and wait for their choice: when the player presses Guess (what they have now), or live while they draw. If live: guess after each stroke ends (`pointerup`), with at most one request in flight; if the drawing changes while one is in flight, send the latest drawing once it comes back, and skip the request if nothing changed. Keep the round counter from "draw-and-guess". Then have them play one round each way and count requests (the Network tab in their browser's developer tools, or a counter on the page), and compare with the numbers from step 1.
  3. Check every request on the server, as in the body's "The page isn't a lock" section: in `POST /api/guess`, catch invalid JSON and return a 400; require `image` to be a string starting with `data:image/png;base64,` and at most about 200,000 characters (a 256×256 drawing is far smaller); return a 405 for other methods on `/api/guess` and a 404 for other paths. Errors are JSON `{ error }`, which the page from "draw-and-guess" already shows. If they let players choose a word list or model on the page, accept only known values on the server.
  4. Add the rate limit from the body's "A budget for guesses" section: `GUESS_LIMIT: bindings.rateLimit({ namespace: "<id>", simple: { limit, period: 60 } })` in `env`, where the namespace is a positive integer as a string, unique among rate limiters in their account (e.g. "1001"). Have the student pick the limit per minute from what they measured in steps 1 and 2, and explain why a single shared key, like `"guess"`, rather than the player's IP address: the docs advise against IP addresses, since many people can share one. Then `cf workers types`, and in the Worker call `env.GUESS_LIMIT.limit({ key: "guess" })` before calling Clef and return a 429 with a JSON `error` when `success` is false. Say plainly that the limit is approximate and counted separately in each Cloudflare location: it's a brake, not a hard ceiling, and a strict limit needs a Durable Object (link the Durable Objects course).
  5. Keep drawings private, as in the body's "Where drawings go" section: make sure nothing logs the image (no `console.log` of the request body), make sure Workers Logs are on (new Workers have them on by default; set `observability: { enabled: true }` under `worker` in `cloudflare.config.ts` to be explicit), and add one line to the page telling players their drawing is sent to an AI model to guess and isn't saved.
  6. Have the student review the Worker's final code. Then deploy with `cf deploy`. A new deploy can take 20 to 30 seconds to serve the new version.
  7. Verify before completing. YOU must, against the deployed workers.dev URL:
     - fetch `/` and confirm a 200 with the page;
     - `POST /api/guess` a 256×256 drawing and confirm a 200 with a probability for every word;
     - `POST` `{"image":"https://example.com/cat.png"}` and a body that isn't JSON, and confirm a 400 for each; send a `GET` to `/api/guess` and confirm a 405;
     - send the limit plus 15 requests in parallel and confirm some come back 429. The limit is approximate, so a few more than the limit may get through. Tell the student first: each request is a real guess, but together they cost a tiny fraction of the free allocation;
     - query the Worker's logs and confirm no event contains `base64`: `cf observability telemetry query --body '{"queryId":"drawing-game","view":"events","limit":100,"dry":true,"timeframe":{"from":<ms an hour ago>,"to":<ms now>},"parameters":{"filters":[{"key":"$metadata.service","operation":"eq","value":"<worker name>","type":"string"}]}}'`. Logs can take a minute to show up. Show the student the same logs in the dashboard (Workers & Pages, their Worker, Logs).
     Don't trust the student saying it worked.
  8. Try it: have the student send the URL to someone in the audience they named, or play it on their phone if nobody's around, and tell you about one drawing Clef got wrong and why they think it did.
  9. Comprehension check: ask the student to walk you through what happens between a player lifting their pen and a bar moving (canvas to a 256×256 PNG, `POST` to the Worker, the checks and the rate limit, the Workers AI binding, Clef's probabilities, back to the page), and to explain one tradeoff they made: when to guess, image size, their win rule, or their rate limit. Gently correct anything off.
  10. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes. Then offer what to try next: Clef instead of Clef-flash for harder drawings (compare its price on the pricing page first), a meter for the `finished` question as they draw, or Clef-omni, which also hears sounds, as Jilles shows in the video on the course page. Then the next course: GET /api/courses, and suggest the next unfinished one in the Projects track.

  Out of scope here: a custom domain (Publish a website's "add-a-domain" covers it), accounts, leaderboards, saving drawings, and Turnstile.
---

# Launch your game

Your game works on your machine. Before you share it, decide what each guess should cost, make sure strangers can't run up your bill, and keep players' drawings private. Then put it online and watch someone else play.

## What a guess costs

Workers AI charges by input tokens, converted to [neurons](https://developers.cloudflare.com/workers-ai/platform/pricing/), and every account gets 10,000 neurons a day free. On the Workers Free plan, that's all there is: using more needs Workers Paid. Clef cuts an image into 32×32-pixel squares and counts each square as a token, and your word list and questions add more. Images smaller than 256×256 are scaled up first, so sending anything smaller saves nothing.

Here's what we measured with an eight-word list:

| Image sent | Input tokens | Time   |
| ---------- | ------------ | ------ |
| 256×256    | 408          | 390 ms |
| 512×512    | 600          | 430 ms |
| 1024×1024  | 1,368        | 860 ms |

At 256×256, a guess with Clef-flash is about 1.4 neurons, so the free allocation covers about 7,000 guesses a day. Check the [pricing page](https://developers.cloudflare.com/workers-ai/platform/pricing/) for current rates: they change.

## When to guess

You have a Guess button. The other way is to guess live: send the drawing after every stroke, so the bars move while the player draws, like in Jilles's video on the [course page](/courses/build-a-drawing-game). It feels like magic, but a drawing can take dozens of strokes, and each one is a request. Neither is wrong. It's a tradeoff between how the game feels and how many guesses it spends.

## The page isn't a lock

Anyone can call `/api/guess` directly, with `curl` or a script, without ever loading your page. Anything the page does to be careful, like disabling the button while it waits, doesn't stop them. So the Worker checks every request itself: it must be JSON, the image must be a PNG, and it can't be bigger than a drawing needs to be.

## A budget for guesses

Even valid requests cost money if someone sends thousands. A [rate limit](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) caps how many guesses your Worker allows per minute:

```ts title="cloudflare.config.ts"
env: {
  AI: bindings.ai({ dev: { remote: true } }),
  GUESS_LIMIT: bindings.rateLimit({ namespace: "1001", simple: { limit: 30, period: 60 } }),
},
```

```ts title="src/index.ts"
const { success } = await env.GUESS_LIMIT.limit({ key: "guess" });
if (!success) {
  return Response.json({ error: "Lots of people are drawing right now. Try again in a minute." }, { status: 429 });
}
```

Every guess uses the same key, so the limit is a budget for the whole game rather than for each player. Your game has no accounts to tell players apart, and IP addresses are a poor substitute, since many people can share one. The limit is approximate and counted separately in each Cloudflare location: a brake, not a hard ceiling. A strict limit needs a [Durable Object](/courses/durable-objects).

## Where drawings go

Each drawing goes from the player's browser to your Worker, then to Workers AI to be guessed. Your code doesn't save it anywhere. [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) record every request. When we checked, they had each request's URL and details about it, but not its body, so drawings stay out of your logs unless your code logs them. Check yours anyway: it takes one search. Tell players what happens to their drawing, in one line on the page.

## Prerequisites

- You've completed [Draw and guess](/courses/build-a-drawing-game/draw-and-guess) and still have that project on disk.
