import { exerciseSchema, type Exercise } from "../schemas/exercise";

/**
 * Static catalog of course exercises. v1 ships one: Deploy your first Worker.
 * Served via GET /api/exercises and GET /api/exercises/{slug}; agent procedure
 * is also summarized in /llms.txt.
 */

const deployFirstWorker: Exercise = exerciseSchema.parse({
  order: 1,
  slug: "deploy-first-worker",
  title: "Deploy your first Worker",
  description:
    "Create a minimal Worker that returns a text response, run it locally, deploy it to your Cloudflare account, and visit its public URL.",
  agentInstructions: `Guide the student through this exercise end to end. Do not skip verification.

1. Create: help them scaffold a minimal Worker that returns a plain-text response (e.g. "Hello from Cloudflare Dev School"). Prefer the simplest possible project — a single Worker script, no framework, no database, no custom domain.
2. Run locally: start the local dev server (typically \`npx wrangler dev\` or \`wrangler dev\`) and confirm the local URL returns the expected text.
3. Deploy: deploy to the student's own Cloudflare account using their existing Wrangler auth from the CLI lesson (\`npx wrangler deploy\` / \`wrangler deploy\`). If they are not authenticated yet, help them finish Wrangler login first.
4. Visit: open the public workers.dev (or other) URL Wrangler prints after deploy.
5. Verify before completing: YOU must fetch the deployed URL (e.g. with curl or fetch) and confirm the response body matches the expected text. Do not trust the student saying it worked — check it yourself.
6. Mark complete: only after verification succeeds, PUT /api/progress/{studentId} with \`{ "exerciseSlug": "deploy-first-worker" }\`. Optionally include \`deployedUrl\` (the public URL you verified) and \`model\` (your current model ID). Never invent other progress endpoints.
7. Afterward: encourage the student to change the response text, redeploy, and hit the URL again so they feel the edit → deploy loop. That deployed Worker is the final result of the school.

Out of scope for this exercise: frameworks (Astro, Next, Hono apps beyond a trivial handler), D1/R2/KV bindings, custom domains, and additional exercises. If the student asks, say those come later and stay focused on the basic loop.`,
  content: `# Deploy your first Worker

This is the hands-on capstone of Cloudflare Dev School. You will create a minimal Worker that returns plain text, run it on your machine, deploy it to your Cloudflare account, and open it on the public internet.

**Out of scope:** frameworks, databases, custom domains, and extra projects. Stay on the basic create → run locally → deploy → visit loop.

## Prerequisites

- A working AI coding agent (you already have one if you're reading this via the school handoff).
- Wrangler installed and authenticated against your Cloudflare account (from the CLI lesson). If \`wrangler whoami\` fails, finish login before deploying.

## 1. Create a minimal Worker

In a new empty directory, scaffold the smallest possible Worker that returns a text response. For example, a Worker whose \`fetch\` handler returns:

\`\`\`ts
return new Response("Hello from Cloudflare Dev School", {
  headers: { "content-type": "text/plain; charset=utf-8" },
});
\`\`\`

Use whatever minimal starter your agent prefers (\`npm create cloudflare@latest\` with a hello-world template, or a hand-written \`wrangler.toml\` + single script). Avoid frameworks, bindings, and routing.

## 2. Run it locally

Start the local dev server:

\`\`\`bash
npx wrangler dev
\`\`\`

Open the local URL Wrangler prints (often \`http://127.0.0.1:8787\`) and confirm you see the expected text.

## 3. Deploy

Deploy to your account:

\`\`\`bash
npx wrangler deploy
\`\`\`

Wrangler will print a public URL (typically on \`*.workers.dev\`).

## 4. Visit the public URL

Open that URL in a browser (or \`curl\` it). You should see the same text response as locally.

## 5. Done — then iterate

Once your agent has verified the live URL, it will record the exercise complete via the Dev School API.

After that, change the response string, redeploy, and hit the URL again. That edit → deploy loop is the whole point.
`,
});

export const exercises: readonly Exercise[] = [deployFirstWorker];

export function listExercises(): Exercise[] {
  return [...exercises].sort((a, b) => a.order - b.order);
}

export function getExercise(slug: string): Exercise | undefined {
  return exercises.find((exercise) => exercise.slug === slug);
}
