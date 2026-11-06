---
description: "Create a minimal Worker that returns a text response, run it locally, deploy it to your Cloudflare account, and visit its public URL."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  You do the work: scaffolding, edits, commands, deploys. The student makes the choices, predicts, and reviews: wherever a step below says to ask the student something, ask, then end your turn and wait for their reply; don't run ahead to the next step in the same turn. Keep each pause short. If the student says "just do it" or similar, speed up for the rest of the exercise, but still show them the handler (step 2) and do the change-and-redeploy step (step 6).

  Adapt how much you explain to their interview answers (GET /api/students/{id}/interviews: Agent setup's agent experience and where they've deployed before, plus this course's own): students who haven't deployed anywhere get a brief, two-or-three-sentence explanation of each new concept as it comes up; students who've used another platform get a one-line comparison to what they know; Cloudflare users get the mechanics without the basics. Experience changes how much you explain, never whether the student makes the choices and predictions. Don't lecture.

  Teaching in sections: the body has three short teaching sections ("A Worker is a fetch handler", "Where it runs", "Local, then deployed") plus "Gotchas". Present each one in your own words, at the step named below, using the student's own code and URLs rather than the body's examples. Keep each to a few sentences. End each with the section's "Check" question in its own message, plus an invitation to ask anything about it, then wait. If their answer is off, correct it gently in a sentence or two. The checks only ask about what that section just taught; never ask about something you haven't covered yet. They're for understanding, not a gate.

  1. Choose: ask the student two things in one message: a name for the Worker (lowercase letters, numbers, and dashes; it becomes the directory, the Worker's name, and part of its workers.dev URL), and the text it should return. If they leave either to you, use `hello-worker` and "Hello from Cloudflare Dev School". If a directory with that name already exists (e.g. they're redoing this exercise), say so and suggest another name. Wait for their answer.
  2. Create: scaffold it with `cf init <name>`, which creates a hello-world Worker with a `cloudflare.config.ts` config, then change the response to their text. Keep it the simplest possible project: a single Worker script, no framework, no database, no custom domain. Show the student the `fetch` handler (the few lines in `src/index.ts`) and present "A Worker is a fetch handler" and its check (expected gist: `request` describes what the visitor asked for, and whatever `Response` the handler returns is exactly what they get; the handler could read the URL or method from `request` to answer differently).
  3. Run locally: start the local dev server with `cf dev` and confirm the local URL it prints returns their text. Give them the local URL to open too.
  4. Predict, then deploy: present "Where it runs" and its check (expected gist: both visitors are served by a copy of the same Worker in a data center near each of them; nothing ran beforehand waiting for them, because isolates start quickly on demand). Then ask the student what they expect `cf deploy` to do: where the Worker will be reachable and what someone visiting it will see. Wait for their answer. Then deploy to the student's own Cloudflare account with `cf deploy`, using their `cf` auth from the CLI exercise in the Agent setup course. If `cf auth whoami` doesn't report `"authenticated": true`, help them run `cf auth login` first. Compare what happened to their prediction.
  5. Verify: YOU must fetch the deployed URL (e.g. with curl or fetch) and confirm the response body matches their text. Do not trust the student saying it worked; check it yourself. A new deploy can take up to about 30 seconds to start serving; retry before assuming something's wrong. Then give the student the URL to open, and present "Local, then deployed" and its check (expected gist: `cf dev` runs the Worker on their machine only, reachable by them; after `cf deploy` the same code serves anyone on the internet at the workers.dev URL, so editing a file locally doesn't change the live Worker until they deploy again).
  6. Change and redeploy: ask the student what the Worker should say instead. Wait for their answer, change the text, redeploy, and fetch the URL again to confirm the new text is live. Have them reload the URL in their browser, so the edit → deploy loop clicks: one command, and the new version serves everyone who visits. Then go over "Gotchas" briefly, as a table if your harness renders Markdown, and invite questions.
  7. Comprehension check: if the student opted into quizzes in Agent setup's interview, ask, in its own message: "Say you added a global variable `let visits = 0` to your Worker and did `visits++` in `fetch`, returning the number. A friend in Tokyo and a friend in London each reload your URL a few times. What would each of them see, and why can't you rely on it as a real counter?" (Expected gist: each copy of the Worker has its own variable, so they'd see separate, possibly resetting counts; isolates run near each visitor and can be evicted at any time, so global state isn't storage. The next exercise adds real storage.) Don't put the answer in the same message, and wait for their reply before saying whether it's right. Gently correct anything off. If they didn't opt in, skip the question and give that example as a one-line takeaway instead. Verification is the gate, not their answer.
  8. Mark complete: only after verification succeeds, mark this exercise complete with PUT /api/progress/{studentId} as /llms.txt describes. Never invent other progress endpoints. Tell the student this same Worker is what the next exercise ("add-a-binding", a Workers KV binding) builds on.

  Out of scope for this exercise: frameworks (Astro, Next, Hono apps beyond a trivial handler), D1/R2 bindings, custom domains, and additional exercises. If the student asks, say those come later and stay focused on the basic loop.
---

# Deploy a Worker

Time to ship something real. In this exercise you'll create a minimal [Cloudflare Worker](https://developers.cloudflare.com/workers/) that returns plain text, run it on your machine, deploy it to your own account, and open it on the public internet. Your agent does the typing; you make the calls.

## What you'll build

A single Worker whose `fetch` handler returns a short text response, live at a `.workers.dev` URL. No frameworks, no database, no custom domain, just the create → run locally → deploy → visit loop.

You choose the Worker's name and what it says, and your agent shows you the handler it writes. Before it deploys, you'll predict where your Worker will end up and what visitors will see. Once it's live, you'll pick new text and watch it redeploy, so the edit → deploy cycle clicks.

Along the way your agent walks you through three short sections below, one at a time, with a quick question after each. Ask it anything as you go.

## Prerequisites

Your agent can help you with any of these.

- [Node.js](https://nodejs.org) installed.
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up).
- The [`cf` CLI](/courses/agent-setup/cli) authenticated against that account (`cf auth whoami`).

## A Worker is a fetch handler

A Worker is a function that receives an HTTP request and returns a response. `cf init` writes one like this:

```ts title="src/index.ts"
export default {
  async fetch(request) {
    return new Response("Hello from Cloudflare Dev School");
  },
};
```

`Request` and `Response` are the same web-standard objects your browser's `fetch()` uses, so there's no framework to learn before you can answer a request.

**Check:** what does `request` give your code, and what decides what a visitor sees?

## Where it runs

There's no server for you to pick or keep running. Cloudflare runs your Worker on its [global network](https://developers.cloudflare.com/workers/reference/how-workers-works/), in the data center closest to whoever makes the request. Each copy runs in a V8 isolate, a lightweight sandbox rather than a container or virtual machine, so it starts quickly when a request arrives.

**Check:** two people on opposite sides of the world open your Worker's URL at the same moment. What handles each request, and where?

## Local, then deployed

`cf dev` runs your Worker on your own machine, at a `localhost` URL only you can reach. `cf deploy` uploads the same code to your Cloudflare account and prints a public URL on your `workers.dev` subdomain. Every deploy replaces the live version for everyone.

**Check:** you edit the text in `src/index.ts` and save, with `cf dev` still running. Who sees the new text, and what would it take for everyone else to see it?

## Gotchas

| Gotcha | What to know |
| --- | --- |
| Global variables aren't storage | A Worker can run as many separate isolates, and any of them can be evicted at any time. Don't keep data you need in module-level variables ([docs](https://developers.cloudflare.com/workers/reference/how-workers-works/)). The next exercise adds real storage. |
| New deploys take a moment | A fresh deploy can take up to about 30 seconds to start serving. If you still see the old text, wait and reload. |
| Your workers.dev URL is public | Anyone with the URL can reach your Worker, so don't return anything private from it. |
