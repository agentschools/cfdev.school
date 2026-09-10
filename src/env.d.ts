/// <reference types="astro/client" />

interface CloudflareEnv {
  DB: D1Database;
  SESSION: KVNamespace;
}

declare module "cloudflare:workers" {
  const env: CloudflareEnv;
  export { env };
}
