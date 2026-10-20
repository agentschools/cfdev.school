import { describe, it, expect, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import YAML from 'yaml';
import { previewIdentity, previewConfig, resourceManager } from './preview-resources.mjs';
const db = '11111111-1111-1111-1111-111111111111';
const kv = '11111111111111111111111111111111';
const names = previewIdentity(42);
function fakeAPI({ existing = false, bad = false, failDelete = false } = {}) {
  let database = existing ? { name: names.database, uuid: bad ? '2c5a6216-085a-4896-8d0f-13255adbdefc' : db } : undefined;
  let session = existing ? { title: names.session, id: kv } : undefined;
  return vi.fn(async (path, opts = {}) => {
    if (opts.method === 'DELETE') {
      if (failDelete) throw new Error('Permission denied');
      if (path.includes('/d1/')) database = undefined;
      if (path.includes('/storage/')) session = undefined;
      return undefined;
    }
    if (opts.method === 'POST') {
      if (path === '/d1/database') return database = { name: opts.body.name, uuid: db };
      return session = { title: opts.body.title, id: kv };
    }
    // Unrelated and production resources must never be selected or deleted.
    if (path.startsWith('/d1/')) return [{ name: 'cloudflare-dev-school', uuid: 'production' }, ...(database ? [database] : [])];
    return [{ title: 'production-session', id: 'production' }, ...(session ? [session] : [])];
  });
}
describe('preview resource isolation', () => {
  it.each(['0', '-1', '1/../../production', '1;echo', '01', '', '9999999999'])('rejects unsafe PR number %s', number => {
    expect(() => previewIdentity(number)).toThrow();
  });
  it('builds an isolated allowlist with no external Durable Object or production resources', () => {
    const config = previewConfig(42, db, kv);
    expect(config.name).toBe(names.worker);
    expect(config.d1_databases).toEqual([{ binding: 'DB', database_name: names.database, database_id: db, migrations_dir: './migrations' }]);
    expect(config.kv_namespaces).toEqual([{ binding: 'SESSION', id: kv }]);
    expect(config.durable_objects.bindings[0]).not.toHaveProperty('script_name');
    for (const key of ['routes', 'route', 'build', 'env', 'services', 'unsafe', 'configPath', 'userConfigPath']) expect(config).not.toHaveProperty(key);
  });
  it('rejects production and malformed IDs', () => {
    expect(() => previewConfig(42, '2c5a6216-085a-4896-8d0f-13255adbdefc', kv)).toThrow();
    expect(() => previewConfig(42, db, '994f1484fe95462f89b748b3ee7be2ff')).toThrow();
    expect(() => previewConfig(42, '../production', kv)).toThrow();
  });
  it('creates empty resources once and reuses them on synchronize', async () => {
    const api = fakeAPI(); const manager = resourceManager(api, 42);
    expect(await manager.provision()).toEqual(previewConfig(42, db, kv));
    await manager.provision();
    expect(api.mock.calls.filter(([, opts]) => opts?.method === 'POST').map(([, opts]) => opts.body)).toEqual([{ name: names.database }, { title: names.session }]);
    expect(api.mock.calls.some(([path]) => /export|query|backup/.test(path))).toBe(false);
  });
  it('deletes only the exact preview resources after deleting the Worker, and is idempotent', async () => {
    const api = fakeAPI({ existing: true }); const manager = resourceManager(api, 42);
    await manager.destroy(); await manager.destroy();
    expect(api.mock.calls.filter(([, opts]) => opts?.method === 'DELETE').map(([path]) => path)).toEqual([
      `/workers/scripts/${names.worker}`, `/d1/database/${db}`, `/storage/kv/namespaces/${kv}`, `/workers/scripts/${names.worker}`,
    ]);
  });
  it('refuses to clean production even if returned under the preview name', async () => {
    const api = fakeAPI({ existing: true, bad: true });
    await expect(resourceManager(api, 42).destroy()).rejects.toThrow('Unsafe D1');
    expect(api.mock.calls.some(([, opts]) => opts?.method === 'DELETE')).toBe(false);
  });
  it('fails closed on API failures instead of deleting data under a live Worker', async () => {
    const api = fakeAPI({ existing: true, failDelete: true });
    await expect(resourceManager(api, 42).destroy()).rejects.toThrow('Permission denied');
    expect(api.mock.calls.filter(([, opts]) => opts?.method === 'DELETE')).toHaveLength(1);
  });
  it('does not interpret lookup failures as absent resources', async () => {
    const api = vi.fn(async () => { throw new Error('Unauthorized'); });
    await expect(resourceManager(api, 42).provision()).rejects.toThrow('Unauthorized');
    expect(api).toHaveBeenCalledTimes(1);
  });
  it('paginates KV and rejects ambiguous ownership', async () => {
    const api = vi.fn(async path => {
      if (path.startsWith('/d1')) return [];
      if (path.endsWith('page=1')) return Array.from({ length: 100 }, () => ({ title: 'other' }));
      return [{ title: names.session, id: kv }, { title: names.session, id: kv }];
    });
    await expect(resourceManager(api, 42).provision()).rejects.toThrow('Ambiguous');
    expect(api).toHaveBeenCalledTimes(3);
  });
});
describe('credential boundary', () => {
  it('builds without secrets and deploys only same-repo artifacts using base-SHA tooling', async () => {
    const text = await readFile('.github/workflows/preview.yml', 'utf8');
    const workflow = YAML.parse(text);
    expect(workflow.on).not.toHaveProperty('pull_request_target');
    expect(workflow.concurrency['cancel-in-progress']).toBe(false);
    for (const name of ['build-preview', 'deploy-preview', 'destroy-preview']) {
      const job = workflow.jobs[name];
      expect(job.if).toContain('github.event.pull_request.head.repo.full_name == github.repository');
      expect(job.if).toContain("github.event.pull_request.base.ref == 'main'");
      expect(job.steps.find(step => step.uses?.startsWith('actions/checkout')).with['persist-credentials']).toBe(false);
    }
    const build = workflow.jobs['build-preview'];
    expect(JSON.stringify(build)).not.toMatch(/secrets\.|CLOUDFLARE_|deployments:write/);
    for (const name of ['deploy-preview', 'destroy-preview']) {
      const job = workflow.jobs[name];
      expect(job.steps[0].with.ref).toBe('${{ github.event.pull_request.base.sha }}');
      expect(job.steps.find(step => step.run?.startsWith('npm ci')).run).toContain('--ignore-scripts');
      expect(job.steps.some(step => step.run?.includes('npm run'))).toBe(false);
    }
    expect(workflow.jobs['deploy-preview'].steps.some(step => step.run === 'test -f scripts/preview-resources.mjs')).toBe(true);
  });
});
