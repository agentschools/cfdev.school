/// <reference types="astro/client" />

// Extends @cloudflare/workers-types' `Cloudflare.Env`, which types both
// `import { env } from "cloudflare:workers"` and the global `Env` used by
// src/worker.ts and Durable Objects.
declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    SESSION: KVNamespace;
    PROGRESS_HUB: DurableObjectNamespace<import("./durable-objects/progress-hub").ProgressHub>;
  }
}

type Env = Cloudflare.Env;
