import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('homepage placeholder', () => {
  it('renders the Cloudflare Dev School heading', () => {
    const source = readFileSync(fileURLToPath(new URL('./index.astro', import.meta.url)), 'utf-8');
    expect(source).toContain('Cloudflare Dev School');
  });
});
