import { getViteConfig } from "astro/config";

// configFile: false skips loading astro.config.mjs (and its @astrojs/cloudflare
// adapter), which is incompatible with Vitest 4's module runner as of this
// writing (https://github.com/withastro/astro/issues/15878). Tests render
// Astro components via the container API and don't need real Worker bindings.
export default getViteConfig({}, { configFile: false });
