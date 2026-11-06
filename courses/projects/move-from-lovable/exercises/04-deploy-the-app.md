---
description: "Deploy your app to Cloudflare and connect it to your new database."
agent-instructions: |
  Follow the course's teaching approach and the steps below with the learner. Use their chosen app; don't replace it with the example. Independently verify the completion checks and pause on unsupported dependencies.
  1. Mark complete only after the page's checks pass, using the progress procedure in /llms.txt.
---

# Deploy the app

Your code is in GitHub and the selected records are in a new database. Connect them and run the app on Workers.

1. Review the change from source URL to destination URL together. Predict which records will appear, then set the destination URL and publishable key wherever the app reads them, including build-time variables when used. Never expose a service key or database password. Supabase's HTTP API needs no Hyperdrive binding.
2. Adapt the existing project using [Cloudflare's TanStack Start guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/) and [cf project guide](https://developers.cloudflare.com/cf/projects/). Check installed package versions and `cf --help`; use `cf` and `cloudflare.config.ts` from Agent setup. Don't scaffold a replacement over the export. If it has a root Wrangler configuration, follow the cf migration guide before running build commands; cf's automatic setup doesn't import those settings.

For a TanStack export, use one deployment adapter. The Lovable `@lovable.dev/vite-tanstack-config` helper can already bundle TanStack, React, Tailwind and Nitro plugins. Adding another complete plugin list to that wrapper duplicates plugins. Replace the wrapper with an ordinary Vite configuration for the Cloudflare path, preserving the app's aliases, CSS plugins, public environment handling, and any custom server entry. This is the minimal plugin order:

```ts
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart(),
    react(),
  ],
});
```

Add `cf` and `@cloudflare/vite-plugin@beta` as project development dependencies so both config imports resolve. Install compatible versions rather than ignoring peer conflicts. The `cf` path uses the 2.0 beta of the Cloudflare Vite plugin; the framework guide's Wrangler configuration is a different CLI path. Configure the minimum Worker in `cloudflare.config.ts`:

```ts
import { defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    name: "my-reading-list",
    entrypoint: "@tanstack/react-start/server-entry",
    compatibilityDate: "2026-11-06",
  },
});
```

Keep an existing custom server entry where the app needs one. For older Vite apps, follow the [React guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/react/) and preserve client routing fallback. If the installed adapter/CLI combination isn't supported, pause and record the incompatibility.

3. Run `cf build`, then `cf dev` for a local check. Run any extra type-check or generation steps from the original build script separately: cf invokes the framework build, not that script. Confirm the imported records render and reads use the destination. Search application code and generated client assets for the source URL; correct remaining database references. Retained backend services may still use source URLs: label those explicitly and check their allowed origins, redirects and behavior. Keep the original configuration outside your release branch.
4. Review the configuration before deploying with `cf` to a temporary Workers URL. Use the selected plan; don't add paid services or switch a custom domain for this lab.
5. Fetch the deployed URL and compare the records. Refresh and open nested routes directly. For server-rendered apps, check server rendering and any server functions too. If data loads in the browser, inspect its network response; a successful homepage response doesn't prove database access works.

Before continuing, explain which parts run on Cloudflare, which run at Supabase, and which remain at the original backend. Your agent independently checks the deployed results before recording completion.
