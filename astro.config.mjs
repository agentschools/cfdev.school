// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://cfdev.school',
  output: 'server',
  adapter: cloudflare(),
  markdown: {
    // Monochrome code blocks for now: plain <pre><code>, no Shiki token colors.
    syntaxHighlight: false,
  },
});
