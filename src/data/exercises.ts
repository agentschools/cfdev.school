import { exerciseSchema, type Exercise } from "../schemas/exercise";

/**
 * Static catalog of course exercises. v1 ships two: Deploy your first Worker,
 * then Add your first binding. Served via GET /api/exercises and
 * GET /api/exercises/{slug}; agent procedure is also summarized in /llms.txt.
 */

const deployFirstWorker: Exercise = exerciseSchema.parse({
  order: 1,
  slug: "deploy-first-worker",
  title: "Deploy your first Worker",
  description:
    "Create a minimal Worker that returns a text response, run it locally, deploy it to your Cloudflare account, and visit its public URL.",
  agentInstructions: `Guide the student through this exercise end to end. Do not skip verification.

Teach lightly as you go. Adapt depth to their interview answers (technicalBackground, cloudflareFamiliarity): beginners get a brief, two-or-three-sentence explanation of each new concept as it comes up; regular Cloudflare users can skip straight to the mechanics. Don't lecture.

1. Create: help them scaffold a minimal Worker that returns a plain-text response (e.g. "Hello from Cloudflare Dev School"). Use \`cf init <directory>\` to scaffold it (it creates a hello-world Worker with a \`cloudflare.config.ts\` config), then edit the response text. Keep it the simplest possible project — a single Worker script, no framework, no database, no custom domain. Explain what a Worker is (a function that runs on Cloudflare's network, close to whoever visits it) and what the \`fetch\` handler does (it receives a request and returns a response).
2. Run locally: start the local dev server with \`cf dev\` and confirm the local URL it prints returns the expected text.
3. Deploy: deploy to the student's own Cloudflare account with \`cf deploy\`, using their \`cf\` auth from the CLI lesson. If \`cf auth whoami\` doesn't report \`"authenticated": true\`, help them run \`cf auth login\` first. Explain what deploying did: the same code that ran locally now runs on Cloudflare's network, and the workers.dev URL \`cf deploy\` prints is its public address.
4. Visit: open the public workers.dev (or other) URL \`cf deploy\` prints.
5. Verify before completing: YOU must fetch the deployed URL (e.g. with curl or fetch) and confirm the response body matches the expected text. Do not trust the student saying it worked — check it yourself.
6. Comprehension check: before marking complete, ask the student to explain in their own words what happens when someone visits their URL (a request hits their Worker's fetch handler on Cloudflare's network, which returns the response). Gently correct anything off. The URL verification above is the gate, not their answer.
7. Mark complete: only after verification succeeds, PUT /api/progress/{studentId} with \`{ "exerciseSlug": "deploy-first-worker" }\`. Optionally include \`deployedUrl\` (the public URL you verified) and \`model\` (your current model ID). Never invent other progress endpoints.
8. Afterward: encourage the student to change the response text, redeploy, and hit the URL again so they feel the edit → deploy loop. This same Worker is what the next exercise (adding a Workers KV binding) builds on.

Out of scope for this exercise: frameworks (Astro, Next, Hono apps beyond a trivial handler), D1/R2 bindings, custom domains, and additional exercises. If the student asks, say those come later and stay focused on the basic loop.`,
  content: `# Deploy your first Worker

This is the first hands-on exercise of Cloudflare Dev School. A Worker is a function that runs on Cloudflare's network, close to whoever visits it; its \`fetch\` handler receives a request and returns a response. You will create a minimal Worker that returns plain text, run it on your machine, deploy it to your Cloudflare account, and open it on the public internet.

**Out of scope:** frameworks, databases, custom domains, and extra projects. Stay on the basic create → run locally → deploy → visit loop.

## Prerequisites

- A working AI coding agent (you already have one if you're reading this via the school handoff).
- The \`cf\` CLI installed and authenticated against your Cloudflare account (from the CLI lesson). If \`cf auth whoami\` doesn't show you as authenticated, run \`cf auth login\` before deploying.

## 1. Create a minimal Worker

Scaffold a new hello-world Worker:

\`\`\`bash
cf init my-first-worker
\`\`\`

Then change its \`fetch\` handler to return your own text, for example:

\`\`\`ts
return new Response("Hello from Cloudflare Dev School", {
  headers: { "content-type": "text/plain; charset=utf-8" },
});
\`\`\`

Avoid frameworks, bindings, and routing.

## 2. Run it locally

Start the local dev server:

\`\`\`bash
cf dev
\`\`\`

Open the local URL it prints (often \`http://localhost:5173\`) and confirm you see the expected text.

## 3. Deploy

Deploy to your account:

\`\`\`bash
cf deploy
\`\`\`

It will print a public URL (typically on \`*.workers.dev\`).

## 4. Visit the public URL

Open that URL in a browser (or \`curl\` it). You should see the same text response as locally.

## 5. Done — then iterate

Once your agent has verified the live URL, it will record the exercise complete via the Dev School API.

After that, change the response string, redeploy, and hit the URL again. That edit → deploy loop is the whole point — and the next exercise builds directly on this same Worker.
`,
});

const addFirstBindingKv: Exercise = exerciseSchema.parse({
  order: 2,
  slug: "add-first-binding-kv",
  title: "Add your first binding",
  description:
    "Create a Workers KV namespace, bind it to the Worker you already deployed, and read and write a value through it to prove the binding actually persists data.",
  agentInstructions: `Guide the student through this exercise end to end. Do not skip verification.

This exercise extends the same Worker from "Deploy your first Worker" (deploy-first-worker) — check GET /api/progress/{studentId} first; if that exercise isn't complete yet, help them finish it before starting this one.

Teach lightly as you go. Adapt depth to their interview answers (technicalBackground, cloudflareFamiliarity): beginners get a brief, two-or-three-sentence explanation of each new concept as it comes up; regular Cloudflare users can skip straight to the mechanics. Don't lecture.

If their Worker from exercise 1 has a \`wrangler.jsonc\`/\`wrangler.json\`/\`wrangler.toml\` instead of a \`cloudflare.config.ts\` (e.g. it was created with Wrangler), offer to convert it with \`cf migrate\` first; if they'd rather not, adapt the steps below to Wrangler for that project.

1. Provision: help them create a KV namespace with \`cf kv namespaces create --title <name>\`. It prints JSON that includes the new namespace's \`id\`. Explain what a KV namespace is: a key-value store on Cloudflare's network, independent of any single Worker.
2. Bind: add \`KV: bindings.kv({ id: "<that id>" })\` to the \`worker.env\` object in their \`cloudflare.config.ts\` (importing \`bindings\` from \`"cf/config"\` if it isn't already). This is a manual edit — don't reach for a template that already has the binding wired up, the point is to see how a binding is declared. Explain what a binding is: the named connection between a Worker and a platform resource, which shows up on \`env\` in the Worker's code.
3. Extend the Worker: update the same Worker's \`fetch\` handler so it reads a \`key\` (and, for writes, a \`value\`) from the request — e.g. query string params — and uses the binding: \`PUT\`-style requests call \`env.KV.put(key, value)\`, \`GET\`-style requests call \`env.KV.get(key)\` and return it (or a 404 if missing). Point out that \`env.KV\` is the binding from step 2 in action.
4. Run locally: start the local dev server with \`cf dev\` and confirm a local write followed by a local read returns the same value. Local dev uses a local simulation of KV, not the real namespace.
5. Deploy: deploy to the student's own Cloudflare account with \`cf deploy\`.
6. Verify before completing: YOU must make two separate requests against the deployed URL — first write a value, then in a follow-up request read it back — and confirm it matches. A single request proving a value round-trips in memory is not enough; the two-step, separately-issued round trip is what proves the KV binding is actually persisting data rather than the Worker just echoing something back. Do not trust the student saying it worked — check it yourself. Tell the student why you verify this way: the separate read is what proves persistence.
7. Comprehension check: before marking complete, ask the student to explain what a binding is in their own words (the named connection between their Worker and the KV namespace, available on \`env\`). Gently correct anything off. The round-trip verification above is the gate, not their answer.
8. Mark complete: only after verification succeeds, PUT /api/progress/{studentId} with \`{ "exerciseSlug": "add-first-binding-kv" }\`. Optionally include \`deployedUrl\` (the public URL you verified) and \`model\` (your current model ID). Never invent other progress endpoints.
9. Afterward: encourage the student to write a few different keys, overwrite an existing key, and confirm each with a GET, to build intuition for how the binding behaves.

Out of scope for this exercise: multiple KV namespaces, list operations, TTL/expiration, R2/D1 bindings, Durable Objects, and additional exercises. If the student asks, say those come later and stay focused on this one binding.`,
  content: `# Add your first binding

This exercise extends the Worker you deployed in "Deploy your first Worker." You will create a Workers KV namespace, bind it to that Worker, and read and write a value through it — the first taste of what a Cloudflare binding is and why it matters.

**Out of scope:** multiple namespaces, list operations, expiration, other storage bindings (R2, D1, Durable Objects), and extra projects. Stay on the basic provision → bind → read/write → verify loop.

## Prerequisites

- You've already completed "Deploy your first Worker" and have a working, deployed Worker project.
- The \`cf\` CLI installed and authenticated against your Cloudflare account (from the CLI lesson).

## 1. Create a KV namespace

From your Worker's project directory:

\`\`\`bash
cf kv namespaces create --title my-first-kv
\`\`\`

It prints JSON that includes the new namespace's \`id\`. Keep it handy for the next step.

## 2. Bind it to your Worker

Add a \`KV\` entry to the \`env\` object in your \`cloudflare.config.ts\`, using the \`id\` from step 1:

\`\`\`ts
import { bindings, defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    // name, compatibilityDate, and entrypoint stay as cf init created them
    env: {
      KV: bindings.kv({ id: "<the id from step 1>" }),
    },
  },
});
\`\`\`

\`KV\` is now available on \`env\` inside your Worker.

## 3. Read and write through the binding

Update your Worker's \`fetch\` handler to read a \`key\` (and for writes, a \`value\`) from the request, for example from the URL's query string, and use the binding:

\`\`\`ts
const url = new URL(request.url);
const key = url.searchParams.get("key");
const value = url.searchParams.get("value");

if (request.method === "PUT" && key && value) {
  await env.KV.put(key, value);
  return new Response(\`stored \${key}\`);
}

if (key) {
  const stored = await env.KV.get(key);
  return stored
    ? new Response(stored)
    : new Response("not found", { status: 404 });
}

return new Response("missing key", { status: 400 });
\`\`\`

## 4. Run it locally

\`\`\`bash
cf dev
\`\`\`

\`PUT\` a value, then \`GET\` it back, against your local URL, to confirm the round trip works before deploying.

## 5. Deploy

\`\`\`bash
cf deploy
\`\`\`

## 6. Verify the binding persists

Once deployed, write a value, then — in a separate request — read it back from the public URL. Getting the same value back proves the KV namespace actually stored it, rather than the Worker just holding it in memory for one request.

## 7. Done — then iterate

Once your agent has verified the round trip, it will record the exercise complete via the Dev School API.

After that, try writing a few different keys, overwriting one, and reading each back. That's the core loop every Cloudflare binding follows: declare it, bind it, read and write through \`env\`.
`,
});

export const exercises: readonly Exercise[] = [deployFirstWorker, addFirstBindingKv];

export function listExercises(): Exercise[] {
  return [...exercises].sort((a, b) => a.order - b.order);
}

export function getExercise(slug: string): Exercise | undefined {
  return exercises.find((exercise) => exercise.slug === slug);
}
