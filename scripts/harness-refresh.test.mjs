import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { parse } from 'yaml';
import { ACTIONS_APP_ID, BRANCH, DATA, REPO, REPO_ID, candidatePR, canonicalData, currentCI, dataOnly, identity, main as runAutomation, protectedMain, provenance, substantive } from './harness-refresh.mjs';

vi.mock('node:fs', async importOriginal => {
  const actual = await importOriginal();
  return { ...actual, readFileSync: vi.fn((...args) => actual.readFileSync(...args)) };
});

const bot = { id: 42, login: 'harness-research[bot]', type: 'Bot', appId: 99 };
const main = 'a'.repeat(40), sha = 'b'.repeat(40);
const clone = value => structuredClone(value);
function pr() { return { number: 137, state: 'open', draft: false, user: bot, head: { sha, ref: BRANCH, repo: { id: REPO_ID, full_name: REPO } }, base: { ref: 'main', repo: { id: REPO_ID, full_name: REPO } } }; }
function protection() { return {
  autoMergeAllowed: true, squashMergeAllowed: true,
  ref: { branchProtectionRule: { pattern: 'main', requiresStatusChecks: true, requiresStrictStatusChecks: true, isAdminEnforced: true, allowsForcePushes: false, allowsDeletions: false, bypassPullRequestAllowances: { totalCount: 0 }, requiredStatusChecks: ['lint', 'test', 'harness-policy'].map(context => ({ context, app: { databaseId: ACTIONS_APP_ID } })) } },
  generator: { branchProtectionRule: { pattern: BRANCH, isAdminEnforced: true, restrictsPushes: true, pushAllowances: { totalCount: 1, nodes: [{ actor: { __typename: 'App', databaseId: bot.appId } }] } } },
}; }
function ci() {
  const workflow = { id: 7, path: '.github/workflows/ci.yml' };
  const run = { id: 8, run_attempt: 2, workflow_id: 7, path: workflow.path, name: 'CI', event: 'pull_request', head_repository: { id: REPO_ID }, head_branch: BRANCH, head_sha: sha, status: 'completed', conclusion: 'success', check_suite_id: 9 };
  const jobs = ['lint', 'test'].map(name => ({ name, head_sha: sha, status: 'completed', conclusion: 'success' }));
  const checks = jobs.map(job => ({ ...job, app: { id: ACTIONS_APP_ID }, check_suite: { id: 9 } }));
  return [run, workflow, sha, jobs, checks, clone(run)];
}
function origin() {
  const generation = { id: 123, run_attempt: 1, repository: { id: REPO_ID }, head_repository: { id: REPO_ID }, path: '.github/workflows/refresh-harnesses.yml', event: 'schedule', head_branch: 'main', head_sha: main, status: 'completed', conclusion: 'success' };
  const commit = { author: { ...bot }, committer: { ...bot }, parents: [{ sha: main }], commit: { verification: { verified: true, reason: 'valid' }, message: `chore: refresh harness data\n\nHarness-run: 123\nHarness-attempt: 1\nHarness-base: ${main}\nHarness-data-sha256: digest` } };
  return [commit, bot, main, generation, 'digest'];
}

describe('harness automation trust boundaries', () => {
  it('requires configured numeric identity and exact bot login', () => {
    expect(() => identity({})).toThrow(/Setup/);
    expect(() => identity({ HARNESS_APP_BOT_ID: '42', HARNESS_APP_BOT_LOGIN: 'human', HARNESS_APP_ID: '99' })).toThrow();
    expect(identity({ HARNESS_APP_BOT_ID: '42', HARNESS_APP_BOT_LOGIN: bot.login, HARNESS_APP_ID: '99' }).id).toBe(42);
  });
  it('accepts only the exact same-repository App PR', () => {
    expect(() => candidatePR(pr(), bot)).not.toThrow();
    for (const mutate of [p => p.user.id++, p => p.user.login = 'other[bot]', p => p.user.type = 'User', p => p.draft = true, p => p.state = 'closed', p => p.merged = true, p => p.head.repo.id++, p => p.base.repo.id++, p => p.head.repo.full_name = 'fork/repo', p => p.head.ref += '-evil', p => p.base.ref = 'other']) {
      const value = clone(pr()); mutate(value); expect(() => candidatePR(value, bot)).toThrow();
    }
  });
  it('rejects executable helpers/workflows, renames, deletions, empty and mixed diffs', () => {
    const file = { filename: DATA, status: 'modified', changes: 2 };
    expect(() => dataOnly([file])).not.toThrow();
    for (const files of [[], [{ ...file, filename: 'src/data/harnesses.ts' }], [file, { ...file, filename: '.github/workflows/ci.yml' }], [{ ...file, status: 'renamed' }], [{ ...file, previous_filename: 'other.json' }], [{ ...file, status: 'removed' }], [{ ...file, changes: 0 }]]) expect(() => dataOnly(files)).toThrow();
    expect(() => canonicalData('[process.exit()]')).toThrow();
    expect(() => canonicalData('{}')).toThrow();
    expect(() => canonicalData(' '.repeat(262145))).toThrow();
    expect(substantive('[{"id":"codex","lastVerified":"old"}]', '[{"id":"codex","lastVerified":"new"}]')).toBe(false);
    expect(substantive('[{"id":"codex"}]', '[{"id":"pi"}]')).toBe(true);
  });
  it('requires native enforced checks and App-only generator pushes', () => {
    expect(() => protectedMain(protection(), bot)).not.toThrow();
    for (const mutate of [p => p.autoMergeAllowed = false, p => p.squashMergeAllowed = false, p => p.ref.branchProtectionRule = null, p => p.ref.branchProtectionRule.requiresStrictStatusChecks = false, p => p.ref.branchProtectionRule.requiresStatusChecks = false, p => p.ref.branchProtectionRule.isAdminEnforced = false, p => p.ref.branchProtectionRule.allowsForcePushes = true, p => p.ref.branchProtectionRule.bypassPullRequestAllowances.totalCount = 1, p => p.ref.branchProtectionRule.requiredStatusChecks.pop(), p => p.ref.branchProtectionRule.requiredStatusChecks[0].app = null, p => p.ref.branchProtectionRule.requiredStatusChecks[0].app.databaseId++, p => p.generator = null, p => p.generator.branchProtectionRule.restrictsPushes = false, p => p.generator.branchProtectionRule.pushAllowances.totalCount = 2, p => p.generator.branchProtectionRule.pushAllowances.nodes[0].actor.databaseId++]) {
      const value = protection(); mutate(value); expect(() => protectedMain(value, bot)).toThrow();
    }
  });
  it('rejects missing, skipped, failed, stale, spoofed and superseded CI', () => {
    expect(() => currentCI(...ci())).not.toThrow();
    for (const mutate of [c => c[0].head_sha = main, c => c[0].workflow_id++, c => c[0].event = 'push', c => c[0].head_repository.id++, c => c[0].conclusion = 'failure', c => c[0].head_branch = 'other', c => c[0].path = '.github/workflows/other.yml', c => c[3].pop(), c => c[3][0].conclusion = 'skipped', c => c[3][0].head_sha = main, c => c[4].pop(), c => c[4][0].app.id++, c => c[4][0].check_suite.id++, c => c[4][0].head_sha = main, c => c[4][0].conclusion = 'neutral', c => c[4].push(clone(c[4][0])), c => c[5].run_attempt++, c => c[5].id++]) {
      const value = ci(); mutate(value); expect(() => currentCI(...value)).toThrow();
    }
  });
  it('requires signed App provenance bound to current main, successful generation and exact digest', () => {
    expect(() => provenance(...origin())).not.toThrow();
    for (const mutate of [c => c[0].author.id++, c => c[0].committer.login = 'human', c => c[0].commit.verification.verified = false, c => c[0].parents.push({ sha }), c => c[0].parents[0].sha = sha, c => c[3].event = 'pull_request', c => c[3].head_branch = BRANCH, c => c[3].head_sha = sha, c => c[3].head_repository.id++, c => c[3].conclusion = 'failure', c => c[3].run_attempt++, c => c[3].path = 'other', c => c[4] = 'tampered', c => c[0].commit.message += '\nextra']) {
      const value = origin(); mutate(value); expect(() => provenance(...value)).toThrow();
    }
  });
  it('fails missing configuration before any network call', () => {
    expect(() => execFileSync(process.execPath, ['scripts/harness-refresh.mjs', 'check'], { env: { PATH: process.env.PATH }, stdio: 'pipe' })).toThrow(/Setup required/);
  });
  it('keeps credentialed jobs on trusted code and previews away from production for drafts/data', () => {
    const refresh = parse(readFileSync('.github/workflows/refresh-harnesses.yml', 'utf8'));
    const merge = parse(readFileSync('.github/workflows/harness-auto-merge.yml', 'utf8'));
    expect(refresh.permissions).toEqual({ contents: 'read' });
    expect(refresh.jobs.research.steps.some(s => JSON.stringify(s).includes('HARNESS_APP_PRIVATE_KEY'))).toBe(false);
    expect(refresh.jobs.validate.steps.some(s => JSON.stringify(s).includes('HARNESS_APP_PRIVATE_KEY'))).toBe(false);
    expect(refresh.jobs.publish.environment).toBe('harness-publisher');
    expect(merge.jobs.arm.environment).toBe('harness-publisher');
    expect(refresh.concurrency.group).toBe(merge.concurrency.group);
    for (const job of [refresh.jobs.publish, merge.jobs.arm, merge.jobs.qualify]) {
      const checkout = job.steps.find(s => s.uses?.startsWith('actions/checkout@'));
      expect(checkout.with).toMatchObject({ ref: '${{ github.sha }}', 'persist-credentials': false });
      expect(job.steps.filter(s => s.run).every(s => /^node scripts\/harness-refresh.mjs (publish|check|enable)$/.test(s.run))).toBe(true);
    }
    expect(merge.on.workflow_run).toMatchObject({ workflows: ['CI'], types: ['completed'] });
    const ciWorkflow = parse(readFileSync('.github/workflows/ci.yml', 'utf8'));
    expect(ciWorkflow.jobs['harness-policy'].if).toBe("github.head_ref != 'chore/refresh-harnesses'");
    expect(ciWorkflow.jobs['harness-policy'].name).toContain("'harness-policy-reserved' || 'harness-policy'");
    const preview = parse(readFileSync('.github/workflows/preview.yml', 'utf8'));
    expect(preview.jobs['deploy-preview'].if).toContain('!github.event.pull_request.draft');
    expect(preview.jobs['deploy-preview'].if).toContain("head.ref != 'chore/refresh-harnesses'");
    expect(preview.jobs['destroy-preview'].if).toBe("github.event.action == 'closed'");
  });
});


// Exercise the full reader -> native arming -> policy completion path with no live writes.
describe('native merge orchestration', () => {
  let directory;
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); if (directory) rmSync(directory, { recursive: true, force: true }); });
  function mockAPI({ stale = false, refuse = false } = {}) {
    directory = mkdtempSync(join(tmpdir(), 'harness-gate-'));
    const event = join(directory, 'event.json');
    writeFileSync(event, JSON.stringify({ repository: { id: REPO_ID }, workflow_run: { id: 8 } }));
    for (const [key, value] of Object.entries({ HARNESS_APP_BOT_ID: '42', HARNESS_APP_ID: '99', HARNESS_APP_BOT_LOGIN: bot.login, HARNESS_AUTO_MERGE_ENABLED: 'true', GITHUB_REPOSITORY: REPO, GITHUB_EVENT_PATH: event, GH_TOKEN: 'reader', APP_TOKEN: 'app' })) vi.stubEnv(key, value);
    const calls = [];
    const [run, workflow, , jobs, checks, latest] = ci();
    if (stale) run.head_sha = main;
    run.pull_requests = [{ number: 137 }];
    const after = canonicalData('[{"id":"codex"}]');
    const [commit, , , generation] = origin();
    commit.commit.message = commit.commit.message.replace('digest', createHash('sha256').update(after).digest('hex'));
    const routes = {
      '/actions/runs/8': run, '/pulls/137': pr(), '/actions/workflows/ci.yml': workflow,
      '/actions/runs/8/attempts/2/jobs?per_page=100': { total_count: 2, jobs },
      [`/commits/${sha}/check-runs?per_page=100`]: { total_count: 2, check_runs: checks },
      [`/actions/workflows/7/runs?event=pull_request&head_sha=${sha}&per_page=100`]: { workflow_runs: [latest] },
      [`/commits/${sha}`]: commit, '/actions/runs/123': { ...generation, workflow_id: 10 },
      '/actions/workflows/refresh-harnesses.yml': { id: 10 }, '/git/ref/heads/main': { object: { sha: main } },
      [`/contents/${DATA}?ref=${sha}`]: { type: 'file', encoding: 'base64', content: Buffer.from(after).toString('base64') },
      [`/contents/${DATA}?ref=${main}`]: { type: 'file', encoding: 'base64', content: Buffer.from('[{"id":"pi"}]').toString('base64') },
      [`/compare/${main}...${sha}`]: { total_commits: 1, status: 'ahead', files: [{ filename: DATA, status: 'modified', changes: 2 }] },
    };
    vi.stubGlobal('fetch', vi.fn(async (url, options = {}) => {
      const path = String(url).replace('https://api.github.com', '').replace(`/repos/${REPO}`, '');
      const body = options.body ? JSON.parse(options.body) : undefined;
      calls.push({ path, method: options.method ?? 'GET', body, token: options.headers?.Authorization });
      let value;
      if (path === '/graphql') {
        value = body.query.startsWith('query') ? { data: { repository: { ...protection(), pullRequest: { id: 'PR_137', headRefOid: sha } } } } : refuse ? { errors: [{ message: 'native refused' }] } : { data: { enablePullRequestAutoMerge: { pullRequest: { number: 137 } } } };
      } else if (path === '/check-runs' && options.method === 'POST') value = { id: 555 };
      else if (path === '/check-runs/555' && options.method === 'PATCH') value = { id: 555 };
      else value = routes[path];
      if (!value) throw new Error(`Unexpected mocked API call ${path}`);
      return new Response(JSON.stringify(value), { status: 200 });
    }));
    return calls;
  }
  it('atomically matches the head and completes required policy only after native arming', async () => {
    const calls = mockAPI();
    await runAutomation('enable');
    const mutations = calls.filter(c => c.method !== 'GET');
    expect(mutations.map(c => c.path)).toEqual(['/graphql', '/check-runs', '/graphql', '/check-runs/555']);
    expect(mutations[1].body).toMatchObject({ name: 'harness-policy', head_sha: sha, status: 'in_progress' });
    expect(mutations[2].body.query).toContain('expectedHeadOid:$sha');
    expect(mutations[2].body.variables).toEqual({ id: 'PR_137', sha });
    expect(mutations[2].token).toBe('Bearer app');
    expect(mutations[3].body.conclusion).toBe('success');
    expect(mutations[3].token).toBe('Bearer reader');
  });
  it('never arms or reports a passing policy for a stale head', async () => {
    const calls = mockAPI({ stale: true });
    await expect(runAutomation('enable')).rejects.toThrow(/current head/);
    expect(calls.every(c => c.method === 'GET')).toBe(true);
  });
  it('leaves policy pending on a refused native mutation without a merge fallback', async () => {
    const calls = mockAPI({ refuse: true });
    await expect(runAutomation('enable')).rejects.toThrow(/native refused/);
    expect(calls.filter(c => c.path === '/check-runs/555')).toHaveLength(0);
    expect(calls.some(c => c.path.includes('/merge'))).toBe(false);
  });
});


describe('publisher lifecycle with a retained protected branch', () => {
  afterEach(async () => {
    vi.unstubAllEnvs(); vi.unstubAllGlobals();
    const actual = await vi.importActual('node:fs');
    vi.mocked(readFileSync).mockImplementation((...args) => actual.readFileSync(...args));
  });
  function publisher() {
    let base = main, branch = null, before = canonicalData('[{"id":"pi"}]'), candidate = canonicalData('[{"id":"codex"}]');
    let nextSHA = sha;
    const calls = [], prs = [], commits = new Map(), contents = new Map([[main, before]]);
    const [oldCommit, , , generation] = origin();
    generation.workflow_id = 10;
    const state = { associated: null, race: false, ancestry: 'identical', generation, workflow: { id: 10 }, files: [{ filename: DATA, status: 'modified', changes: 2 }] };
    for (const [key, value] of Object.entries({ HARNESS_APP_BOT_ID: '42', HARNESS_APP_ID: '99', HARNESS_APP_BOT_LOGIN: bot.login, GITHUB_REPOSITORY: REPO, GITHUB_REF: 'refs/heads/main', GITHUB_SHA: base, GITHUB_RUN_ID: '123', GITHUB_RUN_ATTEMPT: '1', GH_TOKEN: 'app', GH_READ_TOKEN: 'reader' })) vi.stubEnv(key, value);
    vi.mocked(readFileSync).mockImplementation(path => {
      if (path === DATA) return before;
      if (path === 'candidate/harnesses.json') return candidate;
      throw new Error(`Unexpected publisher file read ${path}`);
    });
    vi.stubGlobal('fetch', vi.fn(async (url, options = {}) => {
      const path = String(url).replace(`https://api.github.com/repos/${REPO}`, '').replace('https://api.github.com', '');
      const body = options.body ? JSON.parse(options.body) : undefined;
      const method = options.method ?? 'GET';
      calls.push({ path, body, method, token: options.headers?.Authorization });
      let value;
      if (path === '') value = { id: REPO_ID };
      else if (path === '/git/ref/heads/main') value = { object: { sha: base } };
      else if (path.startsWith('/pulls?state=open')) value = prs.filter(p => p.state === 'open');
      else if (path === `/git/ref/heads/${BRANCH}`) {
        if (!branch) return new Response('{}', { status: 404 });
        if (state.race && calls.some(c => c.path === `/compare/${prs[0].merge_commit_sha}...${base}`)) branch = 'e'.repeat(40);
        value = { object: { sha: branch } };
      } else if (path === '/git/refs' && method === 'POST') { branch = body.sha; value = {}; }
      else if (path === `/git/refs/heads/${BRANCH}` && method === 'PATCH') { branch = body.sha; value = {}; }
      else if (path === '/graphql') {
        expect(body.query).toContain('createCommitOnBranch');
        expect(body.variables.input.expectedHeadOid).toBe(base);
        expect(branch).toBe(base);
        const text = Buffer.from(body.variables.input.fileChanges.additions[0].contents, 'base64').toString();
        const commit = clone(oldCommit);
        commit.parents = [{ sha: base }];
        commit.commit.message = body.variables.input.message.headline + '\n\n' + body.variables.input.message.body;
        commits.set(nextSHA, commit); contents.set(nextSHA, text); branch = nextSHA;
        value = { data: { createCommitOnBranch: { commit: { oid: nextSHA } } } };
      } else if (path === '/pulls' && method === 'POST') {
        const created = clone(pr()); created.number += prs.length; created.head.sha = branch;
        prs.push(created); value = created;
      } else if (path === `/commits/${sha}/pulls`) throw new Error('Missing pagination bound');
      else if (path === `/commits/${sha}/pulls?per_page=100`) value = state.associated ?? prs;
      else if (path === '/pulls/137') value = prs[0];
      else if (path.startsWith('/commits/')) value = commits.get(path.slice('/commits/'.length));
      else if (path === '/actions/runs/123') value = generation;
      else if (path === '/actions/workflows/refresh-harnesses.yml') value = state.workflow;
      else if (path.startsWith(`/contents/${DATA}?ref=`)) value = { type: 'file', encoding: 'base64', content: Buffer.from(contents.get(path.split('?ref=')[1])).toString('base64') };
      else if (path === `/compare/${'c'.repeat(40)}...${base}`) value = { status: state.ancestry };
      else if (path.startsWith('/compare/')) value = { total_commits: 1, status: 'ahead', files: state.files };
      if (!value) throw new Error(`Unexpected publisher API ${method} ${path}`);
      return new Response(JSON.stringify(value), { status: 200 });
    }));
    return {
      calls, prs, commits, contents, state,
      mergeFirst() {
        Object.assign(prs[0], { state: 'closed', merged: true, merged_at: '2026-10-20T00:00:00Z', merge_commit_sha: 'c'.repeat(40) });
        base = prs[0].merge_commit_sha; before = contents.get(sha); contents.set(base, before);
        candidate = canonicalData('[{"id":"cursor"}]'); nextSHA = 'd'.repeat(40);
        vi.stubEnv('GITHUB_SHA', base); vi.stubEnv('GITHUB_RUN_ID', '124'); calls.length = 0;
      },
    };
  }
  it('publishes a second PR after the first merges while its protected branch remains', async () => {
    const fixture = publisher();
    await runAutomation('publish');
    expect(fixture.prs).toHaveLength(1);
    fixture.mergeFirst();
    await runAutomation('publish');
    expect(fixture.prs).toHaveLength(2);
    expect(fixture.prs[1].head.sha).toBe('d'.repeat(40));
    expect(fixture.calls.find(c => c.path === `/git/refs/heads/${BRANCH}`)).toMatchObject({ method: 'PATCH', body: { sha: 'c'.repeat(40), force: true } });
    expect(fixture.calls.filter(c => c.path.startsWith('/actions/')).every(c => c.token === 'Bearer reader')).toBe(true);
  });
  it.each([
    ['unknown branch', f => f.state.associated = []],
    ['unmerged closed PR', f => f.prs[0].merged = false],
    ['legacy bot', f => f.prs[0].user.id++],
    ['different head', f => f.prs[0].head.sha = 'e'.repeat(40)],
    ['fork head', f => f.prs[0].head.repo.id++],
    ['unsigned head', f => f.commits.get(sha).commit.verification.verified = false],
    ['tampered digest', f => f.contents.set(sha, canonicalData('[{"id":"tampered"}]'))],
    ['unsuccessful generation', f => f.state.generation.conclusion = 'failure'],
    ['wrong workflow', f => f.state.workflow.id++],
    ['mixed diff', f => f.state.files.push({ filename: 'script.mjs', status: 'modified', changes: 2 })],
    ['merge outside main', f => f.state.ancestry = 'diverged'],
    ['branch changed during verification', f => f.state.race = true],
  ])('does not mutate a retained branch with %s', async (_label, mutate) => {
    const fixture = publisher(); await runAutomation('publish'); fixture.mergeFirst(); mutate(fixture);
    await expect(runAutomation('publish')).rejects.toThrow();
    expect(fixture.calls.every(c => c.method === 'GET')).toBe(true);
    expect(fixture.prs).toHaveLength(1);
  });
});
