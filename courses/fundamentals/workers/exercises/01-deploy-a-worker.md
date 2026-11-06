---
description: "Create a minimal Worker that returns a text response, run it locally, deploy it to your Cloudflare account, and visit its public URL."
agent-instructions: |
  - Before "Create the project", ask the student for the Worker's name and the text it should return, in one message. If they leave either to you, use `hello-worker` and "Hello from Cloudflare Dev School". If a directory with that name already exists (e.g. they're redoing this exercise), say so and suggest another name.
  - Before "Deploy", ask the student to predict where the Worker will be reachable and what a visitor will see. Compare their prediction to what happened afterward.
  - In "Change it and redeploy", the student picks the new text.
  - Comprehension check, after "Change it and redeploy": ask the student to explain in their own words what happens when someone visits their URL. (A request reaches Cloudflare's network, runs their Worker's `fetch` handler, and gets back the response it returns.)
  - Out of scope: frameworks, other bindings, and custom domains. If the student asks, say those come later.
---

# Deploy a Worker

Time to ship something real. In this exercise you'll create a minimal [Cloudflare Worker](https://developers.cloudflare.com/workers/) that returns plain text, run it on your machine, deploy it to your own Cloudflare account, and open it on the public internet. Then you'll change it and deploy again, which is the loop you'll use for everything you build on Cloudflare.

## What you'll build

A single Worker that answers every request with a short line of text, live at a `.workers.dev` URL. No framework, no database, no custom domain.

## Prerequisites

Your agent can help you with any of these.

- [Node.js](https://nodejs.org) installed.
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up).
- The [`cf` CLI](/courses/agent-setup/cli), logged in to that account. `cf auth whoami` should say `"authenticated": true`. If it doesn't, run `cf auth login`.

## Create the project

Pick a name for your Worker. Use lowercase letters, numbers, and dashes: it becomes the project's directory, the Worker's name on Cloudflare, and part of its public URL. This exercise uses `hello-worker`.

```sh
cf init hello-worker
cd hello-worker
```

[`cf init`](https://developers.cloudflare.com/cf/get-started/first-worker/) creates a new Workers project and installs its dependencies. The two files that matter for now:

- `src/index.ts` is the Worker: the code that runs when someone visits it.
- `cloudflare.config.ts` describes the Worker to Cloudflare: its name, its entrypoint, and any resources it uses.

## Write the handler

A Worker is a function that runs on Cloudflare's network, in data centers close to whoever is visiting. When a request arrives, Cloudflare calls the Worker's `fetch` handler, and whatever [`Response`](https://developers.cloudflare.com/workers/runtime-apis/response/) it returns goes back to the visitor. There's no server for you to run or keep up.

The template's handler reads its greeting from a binding (you'll learn about bindings in the next exercise). Replace `src/index.ts` with a handler that returns your own text:

```ts title="src/index.ts"
export default {
	fetch() {
		return new Response("Hello from Cloudflare Dev School");
	},
} satisfies ExportedHandler;
```

Then remove the template's `WORLD` binding from `cloudflare.config.ts`, so it's down to the Worker's name, compatibility date, and entrypoint:

```ts title="cloudflare.config.ts"
import { defineConfig } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

export default defineConfig({
	worker: {
		name: "hello-worker",
		compatibilityDate: "2026-10-01",
		entrypoint,
	},
});
```

Keep the `compatibilityDate` that `cf init` wrote. It pins which version of the Workers runtime your code runs on.

## Run it locally

```sh
cf dev
```

Open the local URL it prints, `http://localhost:5173/` by default. You should see your text. `cf dev` runs your Worker in the same runtime it uses on Cloudflare, so what works here works when it's deployed. Change the text, save, and refresh: the dev server picks up the change without a restart.

## Deploy

```sh
cf deploy
```

`cf deploy` builds the project, uploads it to your Cloudflare account, and prints the Worker's public URL:

```text
│  Uploaded hello-worker (1.28 sec)
│  Deployed hello-worker triggers (0.94 sec)
│    https://hello-worker.<your-subdomain>.workers.dev
```

The same code that just ran on your machine now runs on Cloudflare's network, and that `workers.dev` URL is its public address. Anyone can visit it.

## Check it works

Open the URL, or fetch it from your terminal:

```sh
curl https://hello-worker.<your-subdomain>.workers.dev
```

You should get your text back. A brand-new Worker can take up to about 30 seconds to start serving, so if you get an error at first, wait a moment and try again.

## Change it and redeploy

Change the text in `src/index.ts` to something new, then deploy again:

```sh
cf deploy
```

Reload the URL in your browser. The new version is live for everyone who visits, a few seconds after one command.

## Why it matters

Every project on Cloudflare uses this same loop: edit, run locally with `cf dev`, ship with `cf deploy`. The rest of the course builds on this Worker. The next exercise, [Add a binding](/courses/workers/add-a-binding), gives it somewhere to store data.
