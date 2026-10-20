import { it, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
const execute = promisify(execFile);
const controller = resolve('scripts/preview-env.mjs');
const db = '11111111-1111-1111-1111-111111111111';
const kv = '11111111111111111111111111111111';
async function fixture(options = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'preview-test-'));
  await mkdir(join(dir, 'node_modules/wrangler/bin'), { recursive: true });
  await mkdir(join(dir, 'preview-artifact/dist/server'), { recursive: true });
  await mkdir(join(dir, 'preview-artifact/dist/client'), { recursive: true });
  await mkdir(join(dir, 'preview-artifact/migrations'), { recursive: true });
  await writeFile(join(dir, 'preview-artifact/dist/server/entry.mjs'), 'throw new Error("artifact must never execute in privileged job");');
  await writeFile(join(dir, 'preview-artifact/migrations/0001.sql'), 'CREATE TABLE example(id TEXT);');
  await writeFile(join(dir, 'preview-artifact/dist/server/wrangler.json'), JSON.stringify({ build: { command: 'exit 99' }, routes: ['cfdev.school'], d1_databases: [{ database_name: 'cloudflare-dev-school' }] }));
  await writeFile(join(dir, 'node_modules/wrangler/bin/wrangler.js'), `require('node:fs').appendFileSync('commands.jsonl', JSON.stringify(process.argv.slice(2))+'\\n'); ${options.failMigration ? "process.exit(process.argv.includes('migrations') ? 1 : 0);" : ''}`);
  // All network calls are intercepted. Unknown endpoints fail the test.
  await writeFile(join(dir, 'mock.mjs'), `
import { appendFileSync } from 'node:fs';
globalThis.fetch = async (url, options = {}) => {
  appendFileSync('requests.jsonl', JSON.stringify({url, method: options.method, body: options.body})+'\\n');
  let result;
  if (url.includes('api.github.com')) {
    if (url.endsWith('/deployments')) result = {id: 1};
    else if (url.includes('/statuses')) result = {};
    else if (url.includes('/deployments?')) result = [];
    else if (url.includes('/files?')) result = [];
    else if (url.endsWith('/pulls/42')) result = {state: '${options.closed ? 'closed' : 'open'}', base: {ref: '${options.otherBase ? 'other' : 'main'}'}, head: {sha: '${options.stale ? 'old' : 'test-sha'}', repo: {full_name: '${options.fork ? 'attacker/repo' : 'agentschools/cloudflare-dev-school'}'}}, body: ''};
    else throw new Error('Unexpected GitHub request '+url);
  } else if (url.includes('api.cloudflare.com')) {
    if (options.method === 'POST' && url.endsWith('/d1/database')) result = {uuid: '${db}'};
    else if (options.method === 'POST' && url.endsWith('/storage/kv/namespaces')) result = {id: '${kv}'};
    else if (options.method === 'GET') result = [];
    else throw new Error('Unexpected Cloudflare request '+url);
    result = {success: true, result};
  } else throw new Error('Unexpected network '+url);
  return {ok: true, status: 200, json: async () => result};
};`);
  return dir;
}
async function run(dir) {
  return execute(process.execPath, ['--import', join(dir, 'mock.mjs'), controller, 'deploy'], {
    cwd: dir,
    // Fake credentials, no inherited real credentials.
    env: { PATH: process.env.PATH, PREVIEW_PR_NUMBER: '42', PREVIEW_SHA: 'test-sha', GITHUB_REPOSITORY: 'agentschools/cloudflare-dev-school', GITHUB_TOKEN: 'fake', GITHUB_RUN_ID: '1', CLOUDFLARE_ACCOUNT_ID: 'fake', CLOUDFLARE_API_TOKEN: 'fake' },
  });
}
it('applies PR SQL and deploys through only the generated isolated config, never artifact code/config', async () => {
  const dir = await fixture();
  try {
    await run(dir);
    const commands = (await readFile(join(dir, 'commands.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse);
    expect(commands).toEqual([
      ['d1', 'migrations', 'apply', 'DB', '--remote', '--config', 'preview-artifact/preview.wrangler.json'],
      ['deploy', '--config', 'preview-artifact/preview.wrangler.json'],
    ]);
    const config = JSON.parse(await readFile(join(dir, 'preview-artifact/preview.wrangler.json'), 'utf8'));
    expect(config.d1_databases[0].database_id).toBe(db);
    expect(config.kv_namespaces[0].id).toBe(kv);
    expect(config.routes).toBeUndefined(); expect(config.build).toBeUndefined();
  } finally { await rm(dir, { recursive: true, force: true }); }
});
it.each([{ stale: true }, { closed: true }, { fork: true }, { otherBase: true }])('refuses provisioning for invalid PR state %j', async options => {
  const dir = await fixture(options);
  try {
    await expect(run(dir)).rejects.toThrow();
    expect(await readFile(join(dir, 'requests.jsonl'), 'utf8')).not.toContain('api.cloudflare.com');
    await expect(readFile(join(dir, 'commands.jsonl'))).rejects.toThrow();
  } finally { await rm(dir, { recursive: true, force: true }); }
});
it('never deploys or reports success when migrations fail; retains resources for retry or close cleanup', async () => {
  const dir = await fixture({ failMigration: true });
  try {
    await expect(run(dir)).rejects.toThrow();
    expect((await readFile(join(dir, 'commands.jsonl'), 'utf8')).trim().split('\n')).toHaveLength(1);
    const requests = await readFile(join(dir, 'requests.jsonl'), 'utf8');
    expect(requests).toContain('failure'); expect(requests).not.toContain('"DELETE"');
    expect(requests).not.toContain('Preview deployed');
  } finally { await rm(dir, { recursive: true, force: true }); }
});
