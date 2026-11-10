import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parse } from "yaml";
import { uploadMedia } from "./upload-media.mjs";

const dirs = [];
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function fixture(content = "new bytes", name = "courses/demo/overview.mp4") {
  const root = await mkdtemp(join(tmpdir(), "media-test-"));
  dirs.push(root);
  const path = join(root, name);
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, content);
  return { root, path, key: name };
}

function s3Error(code, operation) {
  return Object.assign(new Error(code), {
    stderr: `An error occurred (${code}) when calling the ${operation} operation: failed`,
  });
}

// Model an atomic conditional put, with actual disk bytes for GET verification.
function r2(objects = new Map()) {
  const aws = vi.fn(async (args) => {
    const key = args[args.indexOf("--key") + 1];
    if (args.includes("put-object")) {
      expect(args.slice(args.indexOf("--if-none-match"))).toEqual(["--if-none-match", "*"]);
      const bytes = await readFile(args[args.indexOf("--body") + 1]);
      if (objects.has(key)) throw s3Error("PreconditionFailed", "PutObject");
      objects.set(key, bytes);
    } else {
      expect(args).toContain("get-object");
      if (!objects.has(key)) throw s3Error("NoSuchKey", "GetObject");
      await writeFile(args.at(-1), objects.get(key));
      // Deliberately misleading metadata/ETag; only the downloaded bytes count.
      return { ETag: '"not-a-content-hash"', Metadata: { sha256: "untrusted" } };
    }
  });
  return { aws, objects };
}

const endpoint = "https://test-account.r2.cloudflarestorage.com";
const report = () => {};

describe("create-only media uploads", () => {
  it("creates new nested keys atomically and preserves MIME types", async () => {
    const { root, key } = await fixture("WEBVTT", "courses/demo/captions.vtt");
    const { aws, objects } = r2();
    await uploadMedia({ root, endpoint, aws, report });
    expect(objects.get(key).toString()).toBe("WEBVTT");
    expect(aws).toHaveBeenCalledTimes(1);
    expect(aws.mock.calls[0][0]).toEqual(expect.arrayContaining(["--content-type", "text/vtt"]));
  });

  it("skips legacy objects only after hashing their downloaded bytes", async () => {
    const { root, key } = await fixture();
    const { aws } = r2(new Map([[key, Buffer.from("new bytes")]]));
    const log = vi.fn();
    await uploadMedia({ root, endpoint, aws, report: log });
    expect(aws).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("SHA-256 verified"));
  });

  it("rejects different bytes even with the same size and retains local files", async () => {
    const { root, key, path } = await fixture();
    const { aws, objects } = r2(new Map([[key, Buffer.from("old bytes")]]));
    await expect(uploadMedia({ root, endpoint, aws, report })).rejects.toThrow("overview-v2.mp4");
    expect(objects.get(key).toString()).toBe("old bytes");
    expect(await readFile(path, "utf8")).toBe("new bytes");
  });

  it.each(["AccessDenied", "NoSuchBucket", "InternalError", "RequestTimeout", "NoSuchKey"])(
    "fails closed on %s from PUT without a read or unconditional retry", async (code) => {
      const { root, path } = await fixture();
      const aws = vi.fn().mockRejectedValue(s3Error(code, "PutObject"));
      await expect(uploadMedia({ root, endpoint, aws, report })).rejects.toThrow("Could not safely create");
      expect(aws).toHaveBeenCalledTimes(1);
      expect(await readFile(path, "utf8")).toBe("new bytes");
    },
  );

  it.each(["AccessDenied", "NoSuchKey", "InternalError", "network timeout"])(
    "retains files when verification fails with %s", async (code) => {
      const { root, path } = await fixture();
      const aws = vi.fn()
        .mockRejectedValueOnce(s3Error("PreconditionFailed", "PutObject"))
        .mockRejectedValueOnce(s3Error(code, "GetObject"));
      await expect(uploadMedia({ root, endpoint, aws, report })).rejects.toThrow("Cannot verify identical bytes");
      expect(aws).toHaveBeenCalledTimes(2);
      expect(await readFile(path, "utf8")).toBe("new bytes");
    },
  );

  it.each([true, false])("handles concurrent writers (identical: %s)", async (identical) => {
    const first = await fixture();
    const second = await fixture(identical ? "new bytes" : "different bytes");
    const { aws, objects } = r2();
    const results = await Promise.allSettled([first, second].map(({ root }) => uploadMedia({ root, endpoint, aws, report })));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(identical ? 2 : 1);
    expect(objects.size).toBe(1);
    expect(["new bytes", "different bytes"]).toContain(objects.get(first.key).toString());
  });

  it("can safely retry a partial batch without removing its branch files", async () => {
    const { root, key, path } = await fixture();
    await writeFile(join(root, "later.vtt"), "captions");
    const { aws, objects } = r2(new Map([["later.vtt", Buffer.from("wrong captions")]]));
    await expect(uploadMedia({ root, endpoint, aws, report })).rejects.toThrow("later-v2.vtt");
    expect(objects.has(key)).toBe(true);
    expect(await readFile(path, "utf8")).toBe("new bytes");
    // A contributor renames the conflicting file; the prior create is verified.
    await rm(join(root, "later.vtt"));
    await writeFile(join(root, "later-v2.vtt"), "captions");
    await uploadMedia({ root, endpoint, aws, report });
    expect(objects.get("later.vtt").toString()).toBe("wrong captions");
    expect(objects.get("later-v2.vtt").toString()).toBe("captions");
  });

  it("passes unusual filenames as literal arguments", async () => {
    const { root, key } = await fixture("bytes", "courses/a space/$(no-shell); `literal`.vtt");
    const { aws, objects } = r2();
    await uploadMedia({ root, endpoint, aws, report });
    expect(objects.get(key).toString()).toBe("bytes");
  });

  it("never reaches git cleanup in the real workflow block after an unsafe upload", async () => {
    const { root } = await fixture("bytes", "public/media/overview.mp4");
    await mkdir(join(root, "scripts"));
    await writeFile(join(root, "scripts/upload-media.mjs"), await readFile(new URL("./upload-media.mjs", import.meta.url)));
    const bin = join(root, "bin");
    await mkdir(bin);
    await writeFile(join(bin, "aws"), '#!/bin/sh\necho "An error occurred (AccessDenied) when calling the PutObject operation: denied" >&2\nexit 1\n', { mode: 0o755 });
    await writeFile(join(bin, "git"), '#!/bin/sh\necho cleanup-was-reached >&2\nexit 99\n', { mode: 0o755 });
    const workflow = parse(await readFile(resolve(".github/workflows/preview.yml"), "utf8"));
    const block = workflow.jobs["upload-media"].steps.find((s) => s.run?.includes("upload-media.mjs")).run;
    const result = await promisify(execFile)("bash", ["-c", block], {
      cwd: root,
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, R2_ENDPOINT: endpoint, GITHUB_STEP_SUMMARY: join(root, "summary") },
    }).catch((error) => error);
    expect(result.code).toBe(1);
    expect(result.stderr).not.toContain("cleanup-was-reached");
    expect(await readFile(join(root, "public/media/overview.mp4"), "utf8")).toBe("bytes");
  });
});
