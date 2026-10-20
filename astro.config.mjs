// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import { codeTheme, codeTitleTransformer } from './src/lib/code-highlighting';

// https://astro.build/config
export default defineConfig({
  site: 'https://cfdev.school',
  output: 'server',
  adapter: cloudflare(),
  markdown: {
    // ```text blocks (diagrams like file trees) stay plain.
    syntaxHighlight: { type: 'shiki', excludeLangs: ['math', 'text'] },
    shikiConfig: { theme: codeTheme, wrap: true, transformers: [codeTitleTransformer] },
  },
});
