import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { appendFile, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const exec = promisify(execFile);

async function runAws(args) {
  // No shell interpolation, including for contributor-controlled filenames.
  await exec("aws", args, { timeout: 600_000, maxBuffer: 1024 * 1024 });
}

async function sha256(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

async function* mediaFiles(root, prefix = "") {
  for (const entry of await readdir(join(root, prefix), { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue;
    const key = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) yield* mediaFiles(root, key);
    else if (entry.isFile()) yield key;
    else throw new Error(`Unsupported media entry ${JSON.stringify(key)}; use regular files.`);
  }
}

function renameAdvice(key) {
  const versioned = key.replace(/(\.[^./]+)?$/, "-v2$1");
  return `Use a new filename such as ${JSON.stringify(versioned)} and update the Markdown reference.`;
}

// A failed/uncertain write never authorizes cleanup. The workflow only removes
// binaries after this entire script succeeds. Earlier successful creates remain
// published if a later file fails; retrying verifies those bytes before skipping.
export async function uploadMedia({
  root = "public/media",
  endpoint,
  aws = runAws,
  report = console.log,
}) {
  if (!endpoint) throw new Error("R2_ENDPOINT is required.");
  const base = ["--endpoint-url", endpoint, "--region", "auto", "--no-cli-pager", "s3api"];
  for await (const key of mediaFiles(root)) {
    const file = join(root, key);
    const { stdout } = await exec("file", ["--brief", "--mime-type", "--", file]);
    const type = key.endsWith(".vtt") ? "text/vtt" : stdout.trim();
    const object = ["--bucket", "cfdev-school-media", "--key", key];
    try {
      // Do not replace this with HEAD + unconditional PUT or `aws s3 cp`.
      // R2 evaluates this condition atomically, even across concurrent PRs:
      // https://developers.cloudflare.com/r2/api/s3/extensions/#conditional-operations-in-putobject
      await aws([...base, "put-object", ...object, "--body", file,
        "--content-type", type, "--if-none-match", "*"]);
    } catch (error) {
      // Only an explicit conditional-write rejection means the key exists.
      // Auth, transport, missing bucket, server and unknown errors fail closed.
      if (!/\(PreconditionFailed\) when calling the PutObject operation/.test(error.stderr ?? "")) {
        throw new Error(`Could not safely create ${JSON.stringify(key)}; keeping branch media. ${error.message}`, { cause: error });
      }
      const temp = await mkdtemp(join(tmpdir(), "cfdev-media-"));
      try {
        const downloaded = join(temp, "object");
        // Read the authenticated S3 endpoint, never the public CDN. Existing
        // objects lack trusted digest metadata; ETags aren't content hashes.
        await aws([...base, "get-object", ...object, downloaded]);
        if (await sha256(file) !== await sha256(downloaded)) {
          throw new Error("The existing object's bytes differ.", { cause: error });
        }
      } catch (error) {
        // Includes NoSuchKey after a concurrent deletion: no unconditional
        // fallback, no cleanup, and no inference from a failed/negative read.
        throw new Error(`Cannot verify identical bytes for ${JSON.stringify(key)}. ${renameAdvice(key)} Keeping branch media. ${error.message}`, { cause: error });
      } finally {
        await rm(temp, { recursive: true, force: true });
      }
      await report(`Identical (SHA-256 verified), skipped: ${JSON.stringify(key)}`);
      continue;
    }
    await report(`Created: ${JSON.stringify(key)}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const report = async (line) => {
    console.log(line);
    if (process.env.GITHUB_STEP_SUMMARY) {
      // Escape filenames before including them in the Markdown summary.
      const safe = line.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char]);
      await appendFile(process.env.GITHUB_STEP_SUMMARY, `<pre>${safe}</pre>\n`);
    }
  };
  try {
    await uploadMedia({ endpoint: process.env.R2_ENDPOINT, report });
  } catch (error) {
    await report(`${basename(process.argv[1])}: ${error.message}`);
    process.exitCode = 1;
  }
}
