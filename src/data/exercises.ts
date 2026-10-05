import { exerciseSchema, type Exercise } from "../schemas/exercise";

/**
 * Static catalog of course exercises, in order. Served via GET /api/exercises and
 * GET /api/exercises/{slug}; /llms.txt points agents here.
 */

const deployFirstWorker: Exercise = exerciseSchema.parse({
  order: 1,
  slug: "deploy-first-worker",
  title: "Deploy your first Worker",
  description:
    "Create a minimal Worker that returns a text response, run it locally, deploy it to your Cloudflare account, and visit its public URL.",
  agentInstructions: `Guide the student through this exercise end to end. Do not skip verification.

Teach lightly as you go. Adapt depth to their interview answers (agentExperience, platformsUsed): students who haven't deployed anywhere get a brief, two-or-three-sentence explanation of each new concept as it comes up; students who've used another platform get a one-line comparison to what they know; Cloudflare users can skip straight to the mechanics. Don't lecture.

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

Teach lightly as you go. Adapt depth to their interview answers (agentExperience, platformsUsed): students who haven't deployed anywhere get a brief, two-or-three-sentence explanation of each new concept as it comes up; students who've used another platform get a one-line comparison to what they know; Cloudflare users can skip straight to the mechanics. Don't lecture.

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

const useWorkerPreviews: Exercise = exerciseSchema.parse({
  order: 3,
  slug: "use-worker-previews",
  title: "Use Worker Previews",
  description:
    "Test changes to your Worker on an isolated Preview before shipping them to production.",
  agentInstructions: `Guide the student through this exercise end to end. Do not skip verification.

This exercise extends the same Worker from "Add your first binding" (add-first-binding-kv). Check GET /api/progress/{studentId} first; if that exercise isn't complete yet, help them finish it before starting this one.

Teach lightly as you go. Adapt depth to their interview answers (agentExperience, platformsUsed): students who haven't deployed anywhere get a brief, two-or-three-sentence explanation of each new concept as it comes up; students who've used another platform get a one-line comparison to what they know (e.g. Vercel or Netlify preview deployments); Cloudflare users can skip straight to the mechanics. Don't lecture. Run the commands yourself where you can, the student should spend their attention on what's happening, not on typing.

Before starting: confirm \`cf previews deploy --help\` works. If \`cf previews\` isn't a command, the student's \`cf\` is too old: update it globally (\`npm i -g cf@latest\`) and in the project (\`npm i -D cf@latest\`, the project's \`cf/config\` import comes from there). Previews are named after the current git branch, so the project must be a git repository: if it isn't, run \`git init -b main\` and commit the current state first.

Dashboard: at the moments called out below, offer to open the matching Cloudflare dashboard page so the student has something visual to click around on (offer, don't just open it; if they say yes, open it in their default browser). Get the account ID from \`cf auth whoami\` (\`accounts[].id\`). The URL patterns are:
   - Worker overview (production): \`https://dash.cloudflare.com/<account-id>/workers/services/view/<worker-name>/production\`. The Production dropdown in its header switches between production and each Preview.
   - A Preview's overview: \`https://dash.cloudflare.com/<account-id>/workers/services/view/<worker-name>/production/previews/<preview-slug>\`. Append \`/deployments\`, \`/observability\`, or \`/settings\` for those tabs.
   - A KV namespace: \`https://dash.cloudflare.com/<account-id>/workers/kv/namespaces/<namespace-id>\`.
   - Production logs: \`https://dash.cloudflare.com/<account-id>/workers/services/view/<worker-name>/production/observability\`.

1. Branch: create a branch with a short, URL-safe name, e.g. \`git checkout -b try-previews\`. Explain what a Preview is: an isolated copy of the Worker for one branch, under the same Worker, with its own URL and its own logs, so a change can be tested before it reaches production.
2. First Preview, unchanged: write a marker value to production (e.g. \`PUT <production URL>/?key=dev-school&value=production\`), then run \`cf previews deploy\` without changing any code. It prints JSON with \`preview_urls\` and \`deployment_urls\`. Fetch \`<Preview URL>/?key=dev-school\`: it returns \`production\`. Explain why: \`cf\` builds the Preview from the same \`cloudflare.config.ts\`, so the same KV namespace ID means the Preview reads and writes production data. Don't write to KV from this Preview. Dashboard: offer to open the Preview's \`/settings\` page, where its bindings list the same KV namespace ID as production, and point out the Production dropdown that now includes the branch.
3. Isolate: create a second namespace with \`cf kv namespaces create --title <name>-preview\`. Change \`cloudflare.config.ts\` to the function form, \`defineConfig(({ isPreview }) => ({ ... }))\`, and pick the KV namespace ID with \`isPreview\` (preview ID when true, the existing production ID otherwise). In the same edit, add \`ENVIRONMENT: bindings.text(isPreview ? "preview" : "production")\` to \`worker.env\` and \`observability: { enabled: true }\` to \`worker\`, and change the Worker's default response to include \`env.ENVIRONMENT\`. Explain: KV, D1, and R2 are separate resources bound by ID, anything bound to the same ID shares the same data, so isolation means binding the Preview to a different resource. (Durable Objects are the exception: each Preview gets fresh Durable Object storage automatically.)
4. Redeploy the Preview: commit the change, then run \`cf previews deploy\` again. Point out that the Preview URL is the same as before but there's a new deployment URL, and that the first deployment URL still serves the old version. Dashboard: offer to open the Preview's \`/deployments\` page (two deployments, one Preview) and its \`/settings\` page (now bound to the preview namespace). Explain the two kinds of URL: the Preview URL (one per branch) always serves the branch's latest deploy, it's the one to share; a deployment URL (one per deploy) is pinned to one exact version.
5. Test the Preview yourself, with separate requests, and report each status and body to the student in a short table:
   - \`GET <Preview URL>/\` mentions "preview".
   - \`GET <Preview URL>/?key=dev-school\` returns 404 (the Preview's namespace is empty).
   - \`PUT <Preview URL>/?key=dev-school&value=preview\`, then a separate \`GET <Preview URL>/?key=dev-school\` returns \`preview\`.
   - \`GET <production URL>/?key=dev-school\` still returns \`production\`.
   Dashboard: offer to open both KV namespace pages side by side, each holding its own \`dev-school\` value. Invite the student to edit the preview namespace's value in the dashboard, then fetch it from the Preview URL again so they see the change land.
6. Read the Preview's logs: query Workers Observability with \`cf observability telemetry query\`, \`view\` set to \`events\`, filtered on \`$workers.scriptName\` (the Worker's name) and \`$workers.preview.slug\` (the branch name), over the last hour. The exercise content has an example \`--body\`. Show the student the requests you made in step 5. Explain that every log line from a Preview is tagged with its slug, so you can read exactly this branch's logs without production traffic mixed in. Logs can take a minute to arrive; retry if the result is empty. Dashboard: offer to open the Preview's \`/observability\` page, which shows the same events, and suggest they compare it with production's logs.
7. Ship it: \`git checkout main\`, \`git merge try-previews\`, \`cf deploy\`. Then fetch \`<production URL>/\` (it should now mention "production") and \`<production URL>/?key=dev-school\` (still \`production\`). Explain: merging shipped the code; production kept its own binding and its own data, because the config picks the production namespace when \`isPreview\` is false. Dashboard: offer to open the production Worker overview, where the Preview is still listed in the dropdown.
8. Verify before completing: YOU must have seen every check in steps 5 and 7 pass. Do not trust the student saying it worked, check it yourself.
9. Comprehension check: before marking complete, ask the student what a Preview shares with production and what it doesn't (it runs the branch's code from the same config file; with \`cf\`, bindings are only separate when the config picks different resources for \`isPreview\`), and when they'd share a Preview URL versus a deployment URL. Gently correct anything off. The checks above are the gate, not their answer.
10. Mark complete: only after verification succeeds, PUT /api/progress/{studentId} with \`{ "exerciseSlug": "use-worker-previews" }\`. Optionally include \`deployedUrl\` (the Preview URL you verified) and \`model\` (your current model ID). Never invent other progress endpoints.
11. Afterward: once the exercise is complete, briefly suggest where they could go next. Keep each to a sentence or two, lead with the ones that fit their interview answers, and only walk through one if they ask:
   - Make a small change on a new branch and run \`cf previews deploy\` to get a second Preview, named after that branch, sharing the same preview namespace.
   - Connect the repository to Workers Builds so every pull request gets a Preview and its URL posted automatically (https://developers.cloudflare.com/workers/ci-cd/builds/).
   - Preview URLs are public by default (workers.dev Preview URLs send \`X-Robots-Tag: noindex\`); Cloudflare Access can require sign-in, and Previews can also be served on a custom domain (https://developers.cloudflare.com/workers/previews/custom-domains/).
   - Preview secrets can't live in the config file and are set separately (https://developers.cloudflare.com/workers/previews/configuration/).
   - The same \`isPreview\` pattern isolates D1 databases and R2 buckets; Durable Objects get fresh storage per Preview automatically (https://developers.cloudflare.com/workers/previews/resources/).

If the student brings up any of those topics mid-exercise, say they're coming up at the end and stay focused on the main loop.`,
  content: `# Use Worker Previews

This exercise extends the Worker you built in "Add your first binding." A Preview is an isolated copy of your Worker for one git branch, with its own URL and its own logs, so you can test a change before it reaches production. You'll deploy a branch to a Preview, see that it's still reading production data, give it its own KV namespace, test it, read its logs, and then merge and ship.

## Prerequisites

- You've completed "Add your first binding" and have that project on disk.
- A \`cf\` version with \`cf previews deploy\` (update with \`npm i -g cf@latest\` and \`npm i -D cf@latest\` in the project if it's missing).
- The project is a git repository (\`git init -b main\` and commit if it isn't). Previews are named after your current branch.

## 1. Make a branch

\`\`\`bash
git checkout -b try-previews
\`\`\`

## 2. Deploy a Preview without changing anything

Write a marker value to production first, then deploy the branch to a Preview:

\`\`\`bash
curl -X PUT "https://<your-worker>.<subdomain>.workers.dev/?key=dev-school&value=production"
cf previews deploy
\`\`\`

It prints JSON with a Preview URL (\`preview_urls\`) and a deployment URL (\`deployment_urls\`). Read the marker from the Preview URL:

\`\`\`bash
curl "https://try-previews-<your-worker>.<subdomain>.workers.dev/?key=dev-school"
\`\`\`

You get \`production\` back. \`cf\` builds the Preview from the same \`cloudflare.config.ts\`, so it's bound to the same KV namespace as production.

## 3. Give Previews their own KV namespace

\`\`\`bash
cf kv namespaces create --title my-first-kv-preview
\`\`\`

Then turn your config into a function of \`isPreview\`:

\`\`\`ts
import { bindings, defineConfig } from "cf/config";

export default defineConfig(({ isPreview }) => ({
  worker: {
    // name, compatibilityDate, and entrypoint stay as they were
    env: {
      KV: bindings.kv({
        id: isPreview ? "<preview namespace id>" : "<production namespace id>",
      }),
      ENVIRONMENT: bindings.text(isPreview ? "preview" : "production"),
    },
    observability: { enabled: true },
  },
}));
\`\`\`

And make your Worker's default response say where it's running:

\`\`\`ts
return new Response(\`Hello from \${env.ENVIRONMENT}\`);
\`\`\`

KV, D1, and R2 are separate resources bound by ID. Anything bound to the same ID shares its data, so isolating a Preview means binding it to a different resource.

## 4. Redeploy the Preview

\`\`\`bash
git commit -am "Give Previews their own KV namespace"
cf previews deploy
\`\`\`

The Preview URL stays the same, but there's a new deployment URL. Your Preview has two kinds of URL:

- Preview URL, one per branch: always serves the branch's latest deploy. Share this one.
- Deployment URL, one per deploy: pinned to one exact version. The first deployment URL still serves the old code.

## 5. Test the Preview

Your agent checks that the Preview says "preview", that it can't see production's \`dev-school\` value, that a value written to the Preview reads back from the Preview, and that production still returns \`production\`.

## 6. Read the Preview's logs

Every log line from a Preview is tagged with its slug (\`$workers.preview.slug\`), so you can read one branch's logs without production traffic mixed in:

\`\`\`bash
NOW=$(($(date +%s) * 1000))
cf observability telemetry query --body "{
  \\"queryId\\": \\"preview-logs\\",
  \\"view\\": \\"events\\",
  \\"limit\\": 10,
  \\"timeframe\\": { \\"from\\": $((NOW - 3600000)), \\"to\\": $NOW },
  \\"parameters\\": { \\"filters\\": [
    { \\"key\\": \\"\\$workers.scriptName\\", \\"operation\\": \\"eq\\", \\"type\\": \\"string\\", \\"value\\": \\"<your-worker>\\" },
    { \\"key\\": \\"\\$workers.preview.slug\\", \\"operation\\": \\"eq\\", \\"type\\": \\"string\\", \\"value\\": \\"try-previews\\" }
  ] }
}"
\`\`\`

Logs can take a minute to show up.

## 7. Merge and ship

\`\`\`bash
git checkout main
git merge try-previews
cf deploy
\`\`\`

Production now says "production" and still returns its own \`dev-school\` value. Merging shipped the code; production kept its own binding and its own data.

## 8. Done, then iterate

Once your agent has verified all of that, it will record the exercise complete via the Dev School API. Along the way it will offer to open the matching Cloudflare dashboard pages, so you can see your Preview, its deployments, its logs, and both KV namespaces for yourself.

Then your agent will suggest a few places to go next:

- A second Preview from a new branch.
- Workers Builds, which creates a Preview for every pull request automatically.
- Cloudflare Access and custom domains for Previews.
- Preview secrets.
- Isolating D1 and R2 the same way you isolated KV.
`,
});

export const exercises: readonly Exercise[] = [deployFirstWorker, addFirstBindingKv, useWorkerPreviews];

export function listExercises(): Exercise[] {
  return [...exercises].sort((a, b) => a.order - b.order);
}

export function getExercise(slug: string): Exercise | undefined {
  return exercises.find((exercise) => exercise.slug === slug);
}
