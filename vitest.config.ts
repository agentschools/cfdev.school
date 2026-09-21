import { getViteConfig } from "astro/config";

// configFile: false skips loading astro.config.mjs (and its @astrojs/cloudflare
// adapter), which is incompatible with Vitest 4's module runner as of this
// writing (https://github.com/withastro/astro/issues/15878). Tests render
// Astro components via the container API and don't need real Worker bindings.
// This also means astro:content collections aren't available in tests (tried
// a dedicated adapter-free astro.config.test.mjs; getCollection() still came
// back empty, the content layer apparently needs Astro's real dev/build
// orchestration, not just a resolved Vite config). Mock "astro:content" with
// vi.mock() in any test that touches a route using getCollection(), the same
// way "cloudflare:workers" is mocked for D1 access.
export default getViteConfig({}, { configFile: false });
