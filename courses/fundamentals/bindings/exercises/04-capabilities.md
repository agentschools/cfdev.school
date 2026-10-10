---
description: "Run a piece of untrusted code in a Dynamic Worker that gets exactly one binding you choose, and no network."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on the Worker from the earlier exercises; check GET /api/progress/{studentId} first. Teach as you go, pitched to their interview answers (GET /api/students/{id}/interviews).

  Dynamic Workers are only available on the Workers Paid plan once deployed (https://developers.cloudflare.com/dynamic-workers/pricing/). Local dev with `cf dev` works without it, so this exercise is verified locally. Deploying is optional, for students on Workers Paid. Tell the student this up front.

  1. Add a Worker Loader binding: `LOADER: bindings.workerLoader()` in `env`, then run `cf workers types`. Explain: unlike other bindings, it doesn't point at a resource. It lets the Worker start other Workers from code it supplies at runtime, each in its own sandbox.
  2. Define the capability to hand out: in the main Worker's `src/index.ts`, export a named class `Notebook extends WorkerEntrypoint<Env, { prefix: string }>` with two methods, `write(key, value)` and `read(key)`, that call `this.env.NOTES.put`/`get` with the key prefixed by `this.ctx.props.prefix` (e.g. `` `${this.ctx.props.prefix}:${key}` ``). This is a binding you design yourself: the sandboxed code will be able to read and write its own notes, and nothing else in the namespace.
  3. Write the untrusted code as a string: a module (`main.js`) with a default `fetch(request, env)` handler that calls `env.NOTEBOOK.write` and then `env.NOTEBOOK.read`, tries `fetch("https://example.com")` inside a try/catch, and returns JSON with what it read, whether the fetch worked (or its error message), and `Object.keys(env)`. If the student wants, have them ask you to write this code for them, since running code an AI wrote is exactly what this is for.
  4. Add a `/sandbox` route that loads and calls it:
     ```ts
     const worker = env.LOADER.load({
       compatibilityDate: "<same as the Worker's>",
       mainModule: "main.js",
       modules: { "main.js": untrustedCode },
       env: { NOTEBOOK: ctx.exports.Notebook({ props: { prefix: "sandbox" } }) },
       globalOutbound: null,
     });
     return worker.getEntrypoint().fetch(request);
     ```
     `ctx` is the handler's third argument. `ctx.exports.Notebook(...)` is a loopback binding: a binding to the Worker's own `Notebook` export, created on the spot, with `props` only the parent can set. It needs no config with a recent compatibility date. Have the route also read the prefixed key directly from `env.NOTES` and include it in the response, to show the write really landed in the namespace.
  5. Run `cf dev` and GET `/sandbox`. If the main Worker still calls the greeter, it doesn't need to be running for this route.
  6. Verify before completing. YOU must GET `/sandbox` on the local dev server and confirm all of these from the response:
     - the loaded code read back what it wrote through `NOTEBOOK`;
     - its `fetch()` failed (the runtime's error says the Worker isn't permitted to access the internet and must use capabilities, such as bindings in `env`);
     - its `env` keys are only `["NOTEBOOK"]`: no `NOTES`, `API_TOKEN`, or `GREETER`;
     - the key, with its prefix, is in the main Worker's `NOTES` namespace.
     If the student is on Workers Paid and wants to, deploy with `cf deploy` and check the same things on the deployed URL. Don't trust the student saying it worked.
  7. Teach the point:
     - This is capability-based security. The loaded code can only do what it was handed, and it was handed one object. It has no URL to reach, no key to steal, and no ambient network.
     - The Notebook binding wraps the real KV binding, so the parent decides what's exposed (two methods, one prefix). It could also log, rate-limit, or refuse calls. `props` are set by the parent, so the sandboxed code can't change which prefix it gets.
     - This is how Code Mode works: instead of calling tools one by one, the agent writes code against an API, and that code runs in a Dynamic Worker like this one, with outbound `fetch()` blocked (https://developers.cloudflare.com/agents/tools/codemode/how-it-works/). Cloudflare's MCP server, from the Tools exercise in Agent setup, uses Code Mode.
     - It's also where Kenton's 2024 post said bindings were headed: being able to hand another Worker a binding, scoped and temporary. Link to the post if they want the background.
  8. Comprehension check: ask the student what the sandboxed code could do if `globalOutbound: null` were left out (it would inherit the parent's network access and could make requests to the internet), and what it still couldn't do (reach `NOTES`, `API_TOKEN`, or `GREETER`, since it was never handed them). Gently correct anything off.
  9. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes. This is the last exercise in the course. Suggest what's next: another fundamentals course, or a project that uses these bindings.

  Out of scope here: `env.LOADER.get()` with isolate caching, Durable Object Facets, Tail Workers for sandbox logs, and limits on sandboxed code. Mention them only if the student asks.
---

# Hand out capabilities

So far, every binding has come from your config. In this exercise your Worker creates one at runtime and hands it to code you don't trust, which gets exactly that binding and nothing else: no other bindings, and no network.

## What you'll build

A route that runs a small piece of code, maybe code your agent writes, in a [Dynamic Worker](https://developers.cloudflare.com/dynamic-workers/): a sandbox your Worker starts on demand. The sandbox gets one binding, a notebook that can only read and write its own keys in your KV namespace. It can't see your other bindings or secrets, and it can't reach the internet.

Dynamic Workers need the Workers Paid plan once deployed, so you'll run this one locally. Deploying it is optional.

## Prerequisites

- You've completed [Swap resources](/courses/bindings/swap-resources) and still have that Worker on disk.
