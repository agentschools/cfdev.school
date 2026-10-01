// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  markdown: {
    // Monochrome code blocks for now: plain <pre><code>, no Shiki token colors.
    syntaxHighlight: false,
  },
});
