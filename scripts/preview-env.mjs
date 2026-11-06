// Preview deployment strategy: SEEDED PER-PR D1, SHARED SESSION KV.
// Each PR gets its own D1 database, copied from production on the first
// deploy and reused by later pushes, then deleted when the PR closes. The
// PR's migrations are applied to that copy, never to production. The
// SESSION KV namespace is still shared with production.

import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { previewPaths, updateBody } from "./preview-links.mjs";

const appName = "cloudflare-dev-school";
const workersSubdomain = "ziki";

const action = process.argv[2];
const prNumber = requiredEnv("PREVIEW_PR_NUMBER");
const previewSha = requiredEnv("PREVIEW_SHA");
const repo = requiredEnv("GITHUB_REPOSITORY");
const githubToken = requiredEnv("GITHUB_TOKEN");
const githubRunId = requiredEnv("GITHUB_RUN_ID");
const githubServerUrl = process.env.GITHUB_SERVER_URL || "https://github.com";

requiredEnv("CLOUDFLARE_ACCOUNT_ID");
requiredEnv("CLOUDFLARE_API_TOKEN");

const workerName = `${appName}-pr-${prNumber}`;
const productionDatabase = appName;
const previewDatabase = workerName;
const builtConfig = "dist/server/wrangler.json";
const environment = `preview/pr-${prNumber}`;
const environmentUrl = `https://${workerName}.${workersSubdomain}.workers.dev`;
const logUrl = `${githubServerUrl}/${repo}/actions/runs/${githubRunId}`;

if (action === "deploy") {
  await deploy();
} else if (action === "destroy") {
  await destroy();
} else {
  throw new Error("Usage: node scripts/preview-env.mjs <deploy|destroy>");
}

async function deploy() {
  const deployment = await createDeployment();
  await createDeploymentStatus(deployment.id, "in_progress", "Creating preview.");

  try {
    const databaseId = await ensurePreviewDatabase();
    await run("npx", ["astro", "build"]);
    await writePreviewConfig(databaseId);
    await wrangler(["d1", "migrations", "apply", previewDatabase, "--remote", "--config", builtConfig]);
    await wrangler(["deploy", "--name", workerName, "--config", builtConfig]);

    if (!(await isCurrentPullRequestHead())) {
      await createDeploymentStatus(deployment.id, "inactive", "Superseded by a newer commit.");
      return;
    }

    await createDeploymentStatus(deployment.id, "success", "Preview deployed.", {
      environmentUrl,
    });
    await markDeploymentsInactive(deployment.id);
  } catch (error) {
    await createDeploymentStatus(deployment.id, "failure", "Preview deployment failed.");
    throw error;
  }

  // The preview is live, so a failure here shouldn't fail the deployment.
  try {
    await updatePullRequestLinks();
  } catch (error) {
    console.error("Failed to update preview links in the PR body:", error);
  }
}

// Returns the PR's D1 database ID, creating it from a copy of production
// the first time. The export includes d1_migrations, so only the PR's new
// migrations are applied to the copy afterward.
async function ensurePreviewDatabase() {
  const existing = await databaseInfo(previewDatabase);
  if (existing) return existing.uuid;

  await wrangler(["d1", "create", previewDatabase]);
  const dir = await mkdtemp(join(tmpdir(), "cfds-preview-"));
  const dump = join(dir, "production.sql");
  try {
    await wrangler(["d1", "export", productionDatabase, "--remote", "--output", dump]);
    await wrangler(["d1", "execute", previewDatabase, "--remote", "--file", dump]);
  } catch (error) {
    // Don't leave a half-seeded database for the next run to reuse.
    await wrangler(["d1", "delete", previewDatabase, "--skip-confirmation"], { allowFailure: true });
    throw error;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }

  return (await databaseInfo(previewDatabase)).uuid;
}

async function databaseInfo(name) {
  const { stdout, code } = await wrangler(["d1", "info", name, "--json"], { allowFailure: true });
  return code === 0 ? JSON.parse(stdout) : undefined;
}

// The built config inherits wrangler.jsonc's cfdev.school custom domain and
// production database; a preview deploy must use neither.
async function writePreviewConfig(databaseId) {
  const config = JSON.parse(await readFile(builtConfig, "utf8"));
  delete config.routes;
  delete config.route;
  config.d1_databases = config.d1_databases.map((database) =>
    database.binding === "DB"
      ? { ...database, database_name: previewDatabase, database_id: databaseId }
      : database,
  );
  await writeFile(builtConfig, JSON.stringify(config));
}

async function updatePullRequestLinks() {
  const files = [];
  for (let page = 1; ; page++) {
    const batch = await githubApi(`/repos/${repo}/pulls/${prNumber}/files?per_page=100&page=${page}`);
    files.push(...batch);
    if (batch.length < 100) break;
  }

  const urls = previewPaths(files).map((path) => `${environmentUrl}${path}`);
  const pull = await githubApi(`/repos/${repo}/pulls/${prNumber}`);
  const body = updateBody(pull.body, urls);
  if (body === pull.body) return;

  await githubApi(`/repos/${repo}/pulls/${prNumber}`, { method: "PATCH", body: { body } });
  console.log(`Preview links:\n${urls.join("\n")}`);
}

async function destroy() {
  const results = await Promise.allSettled([
    (async () => {
      await wrangler(["delete", "--name", workerName], { allowFailure: true, input: "y\n" });
      await wrangler(["d1", "delete", previewDatabase, "--skip-confirmation"], { allowFailure: true });
    })(),
    markDeploymentsInactive(),
  ]);

  const failure = results.find((result) => result.status === "rejected");
  if (failure) throw failure.reason;
}

async function createDeployment() {
  return githubApi(`/repos/${repo}/deployments`, {
    method: "POST",
    body: {
      ref: previewSha,
      auto_merge: false,
      required_contexts: [],
      environment,
      description: `Preview deployment for PR #${prNumber}`,
      transient_environment: true,
      production_environment: false,
    },
  });
}

async function createDeploymentStatus(deploymentId, state, description, options = {}) {
  return githubApi(`/repos/${repo}/deployments/${deploymentId}/statuses`, {
    method: "POST",
    body: {
      state,
      environment,
      description,
      log_url: logUrl,
      environment_url: options.environmentUrl || "",
      auto_inactive: false,
    },
  });
}

async function markDeploymentsInactive(excludeDeploymentId) {
  const deployments = await githubApi(
    `/repos/${repo}/deployments?environment=${encodeURIComponent(environment)}&per_page=100`,
  );

  await Promise.allSettled(
    deployments
      .filter((deployment) => deployment.id !== excludeDeploymentId)
      .map((deployment) => createDeploymentStatus(deployment.id, "inactive", "Preview destroyed.")),
  );
}

async function isCurrentPullRequestHead() {
  const pull = await githubApi(`/repos/${repo}/pulls/${prNumber}`);
  return pull.head?.sha === previewSha;
}

async function githubApi(path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    method: options.method || "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${githubToken}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API request failed: ${response.status} ${body}`);
  }

  if (response.status === 204) return undefined;
  return response.json();
}

async function wrangler(args, options = {}) {
  return run("npx", ["wrangler", ...args], options);
}

async function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: process.env,
      stdio: [options.input ? "pipe" : "ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0 || options.allowFailure) {
        resolve({ stdout, stderr, code });
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
      }
    });

    if (options.input) child.stdin.end(options.input);
  });
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}
