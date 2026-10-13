---
description: "Create a second Worker with no public URL and call a method on it from your first Worker through a service binding."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on the Worker from "live-objects"; check GET /api/progress/{studentId} and help them finish that first if it isn't complete. Teach as you go, pitched to their interview answers (GET /api/students/{id}/interviews). For students who've split apps into services, compare to what they'd normally need: an internal hostname, a service-to-service API key, and network rules or certificates.

  1. Create the second Worker: scaffold a sibling project next to their Worker with `cf init greeter` (any name works, these steps call it `greeter`). In its `cloudflare.config.ts`, define the Worker with `defineWorker` from `"cf/config"`, export it (e.g. `export const greeter = defineWorker({ ... })`), and pass it to `defineConfig({ worker: greeter })`. Set `workersDev: false` and `previewUrls: false` so it has no public URL at all.
  2. In its `src/index.ts`, export a default class that extends `WorkerEntrypoint` from `"cloudflare:workers"`, typed `WorkerEntrypoint<Env, { caller?: string }>`, with a public method like `async greet(name: string)` that returns a string including `this.ctx.props.caller`. Define it as a normal method, not an arrow-function class field: arrow functions aren't exposed over RPC (https://developers.cloudflare.com/workers/runtime-apis/rpc/visibility/). Give it a `fetch()` that returns a 404, since nobody should reach it over HTTP. Explain RPC briefly: other Workers call `greet()` like a local async function, no HTTP request to build or parse.
  3. Deploy the greeter with `cf deploy`. It deploys, but `cf` prints no URL for it.
  4. Bind it from the main Worker: in the main Worker's `cloudflare.config.ts`, import the exported `greeter` from the greeter project's config and add `GREETER: bindings.worker({ worker: greeter, props: { caller: "<main worker's name>" } })` to `env`. Importing the config (rather than passing the name as a string) is what gives `env.GREETER.greet()` real types; with a string, the binding is typed as a plain `Fetcher`. Run `cf workers types`, then add a `/greet` route that returns `await env.GREETER.greet(name)`.
  5. Run it locally. The main Worker runs under `cf dev`, but `env.GREETER` needs a greeter to call; without one, the call fails with `Worker "greeter" not found`. Since the greeter is already deployed, add `dev: { remote: true }` to the `GREETER` binding: the main Worker runs locally and calls the deployed greeter, with `props` delivered. (The alternative, running `cf dev` in the greeter's directory in a second terminal, also works, but `ctx.props` arrived empty that way in our testing. The docs' single-command setup for multiple Workers, Vite's `auxiliaryWorkers`, doesn't accept a `cloudflare.config.ts` yet.) Mention that the next exercise is all about what `remote` does. If `cf dev` fails with `RemoteSessionAuthenticationError` while `cf auth whoami` shows them logged in, a stray `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_API_KEY`, or `CLOUDFLARE_ACCOUNT_ID` environment variable is overriding their login: check `env | grep CLOUDFLARE_`, and run `cf dev` without those variables (e.g. `env -u CLOUDFLARE_API_TOKEN cf dev`).
  6. Deploy the main Worker with `cf deploy`, then point out in the output that `env.GREETER` is listed as a Worker binding.
  7. Verify before completing. YOU must:
     - fetch `/greet` on the main Worker's deployed URL and confirm it returns the greeter's message, with the main Worker's name as the caller (that's `ctx.props` arriving);
     - fetch the greeter's would-be URL, `https://greeter.<their-subdomain>.workers.dev` (the subdomain is in the main Worker's URL), and confirm it does not return the greeter's response (its `fetch()` 404 text). Cloudflare answers with its own error page instead.
     Deploys can take up to about 30 seconds to start serving; retry before assuming something's wrong. Don't trust the student saying it worked.
  8. Teach the point, using what they just verified:
     - There's no URL an attacker can feed your code to reach the greeter. If your Worker fetches a user-supplied URL (an avatar, a webhook), no URL leads there; only code that uses `env.GREETER` can call it. That's server-side request forgery (SSRF) ruled out by design. One caveat, for students who'll put a Worker on their own domain in front of an origin server: there, a global `fetch()` to the Worker's own zone goes straight to the origin, skipping Cloudflare's security settings, unless the Worker sets the `global_fetch_strictly_public` compatibility flag (https://developers.cloudflare.com/workers/configuration/compatibility-flags/#global-fetch-strictly-public). A workers.dev Worker like theirs has no origin behind it.
     - There's no API key between the two Workers and no certificate to manage. The binding is the permission, and `props` tells the greeter who's calling. The platform ensures `props` can only be set by someone with permission to edit and deploy the Worker receiving them, so the greeter can trust them without signatures or keys (https://developers.cloudflare.com/workers/runtime-apis/context/#props). `props` can also scope a binding to one resource, like a single document: a custom binding.
     - `/env` from the last exercise shows `GREETER` as `{}` and `[object Fetcher]`. Enumerating it (`for (const key in env.GREETER)`) lists only `fetch` and `connect`, yet `typeof env.GREETER.greet` is `"function"`: RPC methods are resolved when called, so they don't show up when enumerated. Show this with a quick `for...in` rather than claiming it.
     - For private services outside Cloudflare (an API in AWS or a home network), Workers VPC gives you the same thing: a binding to one host and port, not open network access. One sentence, no exercise.
  9. Comprehension check: ask the student what an attacker would need to call the greeter, compared to a service with a public URL and an API key. Gently correct anything off.
  10. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes. Then move on to "swap-resources".

  Out of scope here: Durable Objects, `ctx.exports` (it comes up in "capabilities"), HTTP-only service bindings beyond the 404 `fetch()`, and passing functions or stubs over RPC.
---

# Call another Worker

On most platforms, one service calls another over the network: an internal hostname, an API key to prove who's calling, and some network rule that hopefully keeps everyone else out. On Cloudflare, a Worker can call another Worker through a binding, like calling a function.

## What you'll build

A second Worker, the greeter, with a `greet()` method and no public URL at all. Your first Worker calls it through a [service binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/) as `env.GREETER.greet("you")`, and the binding tells the greeter who's calling.

Then you'll check that nothing else can reach the greeter, and think about what that rules out.

## Prerequisites

- You've completed [Live objects](/courses/bindings/live-objects) and still have that Worker on disk.
