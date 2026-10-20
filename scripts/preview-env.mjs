import { spawn } from "node:child_process";
import { writeFile, readdir, lstat, access } from "node:fs/promises";
import { resourceManager, previewIdentity } from "./preview-resources.mjs";
import { previewPaths, updateBody } from "./preview-links.mjs";

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

const workerName = previewIdentity(prNumber).worker;
const resources = resourceManager(cloudflareApi, prNumber);
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
    if (!(await isCurrentPullRequestHead())) throw new Error("PR is closed, foreign, or superseded");
    await validateArtifact();
    const config = await resources.provision();
    await writeFile("preview-artifact/preview.wrangler.json", JSON.stringify(config));
    await wrangler(["d1", "migrations", "apply", "DB", "--remote", "--config", "preview-artifact/preview.wrangler.json"]);
    await wrangler(["deploy", "--config", "preview-artifact/preview.wrangler.json"]);

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

async function validateArtifact() {
  async function walk(path) {
    for (const entry of await readdir(path)) {
      const child = `${path}/${entry}`;
      const stat = await lstat(child);
      if (stat.isSymbolicLink() || (!stat.isFile() && !stat.isDirectory())) throw new Error("Unsafe artifact entry");
      if (stat.isDirectory()) await walk(child);
    }
  }
  await walk("preview-artifact");
  await access("preview-artifact/dist/server/entry.mjs");
  await access("preview-artifact/dist/client");
  if (!(await readdir("preview-artifact/migrations")).some(file => file.endsWith(".sql"))) throw new Error("Missing migrations");
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
  await resources.destroy();
  await markDeploymentsInactive();
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

  await Promise.all(
    deployments
      .filter((deployment) => deployment.id !== excludeDeploymentId)
      .map((deployment) => createDeploymentStatus(deployment.id, "inactive", "Preview destroyed.")),
  );
}

async function isCurrentPullRequestHead() {
  const pull = await githubApi(`/repos/${repo}/pulls/${prNumber}`);
  return pull.state === "open" && pull.base?.ref === "main" && pull.head?.sha === previewSha && pull.head?.repo?.full_name === repo;
}

async function cloudflareApi(path, options = {}) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${requiredEnv("CLOUDFLARE_ACCOUNT_ID")}${path}`, {
    method: options.method || "GET",
    headers: { Authorization: `Bearer ${requiredEnv("CLOUDFLARE_API_TOKEN")}`, "Content-Type": "application/json" },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (response.status === 404 && options.missingOK) return undefined;
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(`Cloudflare request failed: ${response.status} ${JSON.stringify(result.errors)}`);
  return result.result;
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
  return run(process.execPath, ["node_modules/wrangler/bin/wrangler.js", ...args], options);
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
      if (code === 0) {
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
