---
description: "Write your word list, send each drawing to Clef on Workers AI, and show a probability for every word."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on the app from "build-a-canvas"; check GET /api/progress/{studentId} first, and read the project's `AGENTS.md`. Read this course's interview for the theme. If they've completed Build a guestbook, they've met Clef in "moderate-messages": say so, and go lighter on what a decision model is. Teach the body's sections as you go, before the code that uses them.

  1. Write the word list together. From the interview's second answer, draft 8 to 15 words, each with a short description, and show them to the student. Point out any pair that would look alike when drawn (the body's circle and sun), and suggest swapping one. Wait for the student to edit or approve the list. Put it in `src/words.ts` as a `WORDS` object (word to description, `satisfies Record<string, string>`) with `export type Word = keyof typeof WORDS`; the Worker and the page both import it.
  2. Add the Workers AI binding: `AI: bindings.ai({ dev: { remote: true } })` in `env` in `cloudflare.config.ts`, then `cf workers types`. There's no local simulation of Workers AI, so `cf dev` calls the real model on their account: they need `cf auth login` first. Without `dev: { remote: true }`, `cf dev` fails with "Binding AI needs to be run remotely". If it stops with "More than one account available", add `accountId: "<id>"` at the top level of `defineConfig` (next to `worker`), with the account ID from `cf auth whoami`. If `cf dev` fails with `RemoteSessionAuthenticationError`, a stray `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_API_KEY`, or `CLOUDFLARE_ACCOUNT_ID` variable is overriding their login.
  3. Add `POST /api/guess` to the Worker, as in the body: read `{ image }` from the JSON body, return a 400 unless it's a string starting with `data:image/png;base64,`, call `@cf/cloudflare/clef-flash` with `model: "clef-flash"`, `images: [image]`, a short `state`, and one `choice` question named `guess` whose `criteria` is `WORDS`, then return the result plus the time it took in `ms`. Keep every other path a 404. "launch-your-game" adds the rest of the server-side checks.
  4. Before the first guess, have the student draw one of their words and predict which word wins and roughly how sure Clef will be. Wait for their answer.
  5. Add a Guess button: it sends the 256×256 preview image from "build-a-canvas" to `/api/guess`, is disabled while waiting, and then shows the top guess and every word, highest first, each with its percentage as text and a bar (a `<meter>` or a styled `<div>`). Show the percentage as text, not just the bar, so the result doesn't depend on seeing colors or lengths. Have the student review the change before they try it.
  6. Verify before completing. YOU must, against the local dev server:
     - `POST /api/guess` two different drawings and confirm both return 200, `answers.guess.probabilities` has every word on their list, the probabilities add up to about 1, and the top choices differ. Use drawings saved from the app's preview (ask the student to save two), or make simple test PNGs: 256×256, a white background, black lines;
     - `POST` `{"image":"hello"}` and confirm a 400;
     - ask the student to play a few drawings in the browser and tell you what Clef guessed, and whether their prediction was right.
     Don't trust the student saying it worked.
  7. Comprehension check: ask the student why Clef returns a number for every word instead of a sentence, and what they'd change to make a completely different game. (It scores options rather than writing text, so the answer is already in the shape the page needs; and they'd only change the word list.) Gently correct anything off.
  8. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes. Then move on to "draw-and-guess".

  Out of scope here: rounds and winning (next exercise), rate limits and image size checks ("launch-your-game"), Clef instead of Clef-flash, and AI Gateway.
---

# Add a decision model

Your canvas works. Now it needs someone to guess. In this exercise you'll write the list of words players can draw, send each drawing to a model, and show its answer as a bar for every word.

## What's a decision model?

Most AI models you've used write text: you ask, they answer in words. A decision model doesn't write anything. You give it some input and a question with the answers you allow, and it returns a probability for each answer. It's fast, and there's nothing to parse: the answer is already in the shape your code needs.

[Clef](https://developers.cloudflare.com/workers-ai/models/clef-flash/) is a family of decision models made by Cloudflare that run on [Workers AI](https://developers.cloudflare.com/workers-ai/). It can look at images, and it has three kinds of question:

- `choice`: pick one option from a list you define. That's your game's guess.
- `noul`: yes or no, returned as the probability of yes.
- `score`: a rating on a scale you write.

You'll use Clef-flash, the fastest and cheapest of them. If you took [Build a guestbook](/courses/build-a-guestbook), you've already used it to catch spam with a `noul` question.

## Your word list

Your word list is the whole game. Each word has a short description, and Clef reads it to decide what each option means:

```ts title="src/words.ts"
export const WORDS = {
  cow: "A cow",
  duck: "A duck",
  tractor: "A tractor",
  barn: "A red barn",
  // ...
} satisfies Record<string, string>;

export type Word = keyof typeof WORDS;
```

Words that look alike when drawn compete with each other. When we drew a circle with "sun" as the target, Clef said circle with 95% and sun with 2%. Both were on the list, and a plain circle looks more like a circle. Pick words that look different, or describe them so they do: "The sun, with rays around it".

## Asking for a guess

Your Worker sends the drawing and the word list to Clef, and passes the answer back to the page:

```ts title="src/index.ts"
import { env } from "cloudflare:workers";
import { WORDS } from "./words.ts";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/guess" || request.method !== "POST") {
      return new Response("Not found", { status: 404 });
    }

    const { image } = await request.json<{ image: unknown }>();
    if (typeof image !== "string" || !image.startsWith("data:image/png;base64,")) {
      return Response.json({ error: "Send a PNG data URL" }, { status: 400 });
    }

    const started = Date.now();
    const result = await env.AI.run("@cf/cloudflare/clef-flash", {
      model: "clef-flash",
      images: [image],
      state: "A hand-drawn sketch on a white canvas. It may still be in progress.",
      questions: {
        guess: { type: "choice", instructions: "Which word is the player drawing?", criteria: WORDS },
      },
    });
    return Response.json({ ...result, ms: Date.now() - started });
  },
} satisfies ExportedHandler;
```

The answer has a probability for every word, adding up to 1, and `choice` is the highest one. Here's a real answer for a drawing of a house, with an eight-word list:

```json
{
  "answers": {
    "guess": {
      "type": "choice",
      "choice": "house",
      "probabilities": {
        "circle": 0.0077,
        "triangle": 0.0084,
        "square": 0.0086,
        "house": 0.9456,
        "person": 0.0086,
        "sun": 0.0065,
        "tree": 0.0073,
        "fish": 0.0073
      },
      "confidence": 0.8794
    }
  },
  "usage": { "input_tokens": 408, "output_tokens": 0 },
  "ms": 386
}
```

The drawing never goes from the browser to the model directly. The page talks to your Worker, and only your Worker can call Workers AI through its binding, so there's no API key in the page for anyone to copy.

## Prerequisites

- You've completed [Build a canvas](/courses/build-a-drawing-game/build-a-canvas) and still have that project on disk.
- The [`cf` CLI](/courses/agent-setup/cli) logged in to your Cloudflare account (`cf auth whoami`).
