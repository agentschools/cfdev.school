import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const REPO = 'agentschools/cloudflare-dev-school';
export const REPO_ID = 1264727819;
export const BRANCH = 'chore/refresh-harnesses';
export const DATA = 'src/data/harnesses.json';
export const ACTIONS_APP_ID = 15368;
export const REQUIRED = ['lint', 'test'];
export function requireSafe(condition, message) {
  if (!condition) throw new Error(message);
}
export function identity(env = process.env) {
  requireSafe(/^[1-9]\d*$/.test(env.HARNESS_APP_BOT_ID ?? '') && /^[a-z0-9-]+\[bot\]$/.test(env.HARNESS_APP_BOT_LOGIN ?? ''),
    'Setup required: configure HARNESS_APP_BOT_ID and HARNESS_APP_BOT_LOGIN; see docs/harness-refresh.md.');
  requireSafe(/^[1-9]\d*$/.test(env.HARNESS_APP_ID ?? ''), 'Setup required: configure HARNESS_APP_ID.');
  return { id: Number(env.HARNESS_APP_BOT_ID), login: env.HARNESS_APP_BOT_LOGIN, appId: Number(env.HARNESS_APP_ID) };
}
export function sameBot(user, bot) {
  return user?.id === bot.id && user?.login === bot.login && user?.type === 'Bot';
}
export function canonicalData(text) {
  requireSafe(Buffer.byteLength(text) <= 256 * 1024, 'Candidate exceeds 256 KiB.');
  const value = JSON.parse(text);
  requireSafe(Array.isArray(value) && value.length > 0 && value.every(p => p && typeof p === 'object' && !Array.isArray(p)), 'Expected nonempty profile array.');
  return JSON.stringify(value, null, 2) + '\n';
}
export function substantive(before, after) {
  const omitDates = text => JSON.parse(text).map(profile => {
    const copy = { ...profile };
    delete copy.lastVerified;
    return copy;
  });
  return JSON.stringify(omitDates(before)) !== JSON.stringify(omitDates(after));
}
export function dataOnly(files) {
  requireSafe(files.length === 1 && files[0].filename === DATA && files[0].status === 'modified' && !files[0].previous_filename && files[0].changes > 0,
    'Refusing anything except a nonempty modification of harnesses.json.');
}
function expectedPR(pr, bot) {
  requireSafe(sameBot(pr.user, bot), 'PR must be authored by the configured App bot.');
  requireSafe(pr.base?.repo?.id === REPO_ID && pr.head?.repo?.id === REPO_ID && pr.base.repo.full_name === REPO && pr.head.repo.full_name === REPO,
    'PR must have the exact expected repository on both sides.');
  requireSafe(pr.base.ref === 'main' && pr.head.ref === BRANCH, 'Unexpected PR base or generator branch.');
}
export function candidatePR(pr, bot) {
  requireSafe(pr.state === 'open' && !pr.draft && !pr.merged, 'PR must be open and ready.');
  expectedPR(pr, bot);
}
export function protectedMain(repo, bot) {
  const rule = repo.ref?.branchProtectionRule;
  requireSafe(repo.autoMergeAllowed && repo.squashMergeAllowed && rule?.pattern === 'main' && rule.requiresStatusChecks && rule.requiresStrictStatusChecks && rule.isAdminEnforced && !rule.allowsForcePushes && !rule.allowsDeletions && rule.bypassPullRequestAllowances.totalCount === 0,
    'Setup required: native auto-merge, squash merges, and enforced strict main protection without bypasses; see docs/harness-refresh.md.');
  const branch = repo.generator?.branchProtectionRule;
  requireSafe(branch?.pattern === BRANCH && branch.isAdminEnforced && branch.restrictsPushes && branch.pushAllowances.totalCount === 1 && branch.pushAllowances.nodes[0]?.actor?.databaseId === bot.appId && branch.pushAllowances.nodes[0]?.actor?.__typename === 'App',
    'Setup required: enforce App-only pushes to the exact generator branch, including administrators.');
  for (const context of [...REQUIRED, 'harness-policy']) requireSafe(rule.requiredStatusChecks.some(c => c.context === context && c.app?.databaseId === ACTIONS_APP_ID), `Setup required: enforce ${context} from the GitHub Actions App on main.`);
}
export function currentCI(run, workflow, sha, jobs, checks, latest) {
  requireSafe(workflow.path === '.github/workflows/ci.yml' && run.workflow_id === workflow.id && run.path === workflow.path && run.name === 'CI' && run.event === 'pull_request' && run.head_repository?.id === REPO_ID && run.head_branch === BRANCH && run.head_sha === sha && run.status === 'completed' && run.conclusion === 'success', 'CI identity, current head, event, or conclusion did not match.');
  requireSafe(latest.id === run.id && latest.run_attempt === run.run_attempt, 'A newer CI run/attempt supersedes this event.');
  for (const name of REQUIRED) {
    const job = jobs.filter(j => j.name === name);
    requireSafe(job.length === 1 && job[0].head_sha === sha && job[0].status === 'completed' && job[0].conclusion === 'success', `Missing, skipped, stale, or failing ${name} job.`);
    const check = checks.filter(c => c.name === name);
    requireSafe(check.length === 1 && check[0].head_sha === sha && check[0].status === 'completed' && check[0].conclusion === 'success' && check[0].app?.id === ACTIONS_APP_ID && check[0].check_suite?.id === run.check_suite_id, `Untrusted or stale ${name} check.`);
  }
}
export function provenance(commit, bot, base, generation, digest) {
  requireSafe(sameBot(commit.author, bot) && sameBot(commit.committer, bot) && commit.commit.verification?.verified && commit.commit.verification.reason === 'valid', 'Expected a verified commit created by the configured GitHub App.');
  requireSafe(commit.parents.length === 1 && commit.parents[0].sha === base, 'Candidate must be a single generated commit directly on current main.');
  requireSafe(generation.repository?.id === REPO_ID && generation.head_repository?.id === REPO_ID && generation.path === '.github/workflows/refresh-harnesses.yml' && ['schedule', 'workflow_dispatch'].includes(generation.event) && generation.head_branch === 'main' && generation.head_sha === base && generation.status === 'completed' && generation.conclusion === 'success', 'Invalid generation workflow provenance.');
  requireSafe(commit.commit.message === message(generation.id, generation.run_attempt, base, digest), 'Generation run, attempt, base, or data digest does not match the signed commit.');
}
const hash = text => createHash('sha256').update(text).digest('hex');
const message = (run, attempt, base, digest) => `chore: refresh harness data\n\nHarness-run: ${run}\nHarness-attempt: ${attempt}\nHarness-base: ${base}\nHarness-data-sha256: ${digest}`;

export async function api(path, options = {}, token = process.env.GH_TOKEN) {
  const response = await fetch(`https://api.github.com${path}`, { ...options, headers: {
    Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28',
    ...options.headers,
  } });
  requireSafe(response.ok, `GitHub API ${options.method ?? 'GET'} ${path}: ${response.status}. See docs/harness-refresh.md for setup prerequisites.`);
  return response.status === 204 ? null : response.json();
}
const rest = (path, options) => api(`/repos/${REPO}${path}`, options);
const post = body => ({ method: 'POST', body: JSON.stringify(body) });
async function graphql(query, variables, token) {
  const result = await api('/graphql', post({ query, variables }), token);
  requireSafe(!result.errors, `GraphQL request refused: ${JSON.stringify(result.errors)}`);
  return result.data;
}
async function content(ref) {
  const file = await rest(`/contents/${DATA}?ref=${ref}`);
  requireSafe(file.type === 'file' && file.encoding === 'base64', 'Expected a regular data file.');
  return Buffer.from(file.content, 'base64').toString('utf8');
}
async function maybeRef() {
  // Only an actual 404 means absent. Never turn auth/network errors into branch creation.
  const response = await fetch(`https://api.github.com/repos/${REPO}/git/ref/heads/${BRANCH}`, { headers: { Authorization: `Bearer ${process.env.GH_TOKEN}` } });
  if (response.status === 404) return null;
  requireSafe(response.ok, `Cannot inspect generator branch: ${response.status}`);
  return response.json();
}
async function retainedMergedBranch(previous, bot, base) {
  const sha = previous.object.sha;
  const associated = await rest(`/commits/${sha}/pulls?per_page=100`);
  requireSafe(associated.length < 100, 'Incomplete retained-branch PR history; refusing reuse.');
  const merged = associated.filter(pr => pr.head?.sha === sha && pr.state === 'closed' && pr.merged_at);
  requireSafe(merged.length === 1, 'Generator branch has no unique merged generated PR. Review and retire unknown/legacy branches manually.');
  const pr = await rest(`/pulls/${merged[0].number}`);
  expectedPR(pr, bot);
  requireSafe(pr.state === 'closed' && pr.merged === true && pr.merged_at && pr.head.sha === sha && pr.merge_commit_sha,
    'Retained branch must still match the merged App PR head.');
  const commit = await rest(`/commits/${sha}`);
  requireSafe(commit.parents.length === 1, 'Retained head must have exactly one generation base.');
  const historicalBase = commit.parents[0].sha;
  const runId = /^Harness-run: ([1-9]\d*)$/m.exec(commit.commit.message)?.[1];
  requireSafe(runId && process.env.GH_READ_TOKEN, 'Missing retained generation provenance or read-only workflow token.');
  // Keep Actions read on the job token, not on the minimum-permission App.
  const generation = await api(`/repos/${REPO}/actions/runs/${runId}`, {}, process.env.GH_READ_TOKEN);
  const workflow = await api(`/repos/${REPO}/actions/workflows/refresh-harnesses.yml`, {}, process.env.GH_READ_TOKEN);
  requireSafe(generation.workflow_id === workflow.id, 'Wrong retained generator workflow identity.');
  const text = await content(sha);
  requireSafe(text === canonicalData(text) && substantive(await content(historicalBase), text), 'Retained data must be canonical and substantive.');
  provenance(commit, bot, historicalBase, generation, hash(text));
  const comparison = await rest(`/compare/${historicalBase}...${sha}`);
  requireSafe(comparison.total_commits === 1 && comparison.status === 'ahead', 'Retained head must be exactly one generated commit.');
  dataOnly(comparison.files);
  const ancestry = await rest(`/compare/${pr.merge_commit_sha}...${base}`);
  requireSafe(['ahead', 'identical'].includes(ancestry.status), 'Merged generated PR is not in current main history.');
}
async function publish() {
  const bot = identity();
  const repo = await rest('');
  requireSafe(repo.id === REPO_ID && process.env.GITHUB_REPOSITORY === REPO && process.env.GITHUB_REF === 'refs/heads/main', 'Unexpected publishing repository/ref.');
  const base = process.env.GITHUB_SHA;
  requireSafe((await rest('/git/ref/heads/main')).object.sha === base, 'Main moved during research; wait for the next refresh.');
  const before = readFileSync(DATA, 'utf8');
  const after = canonicalData(readFileSync('candidate/harnesses.json', 'utf8'));
  if (!substantive(before, after)) { console.log('No substantive changes.'); return; }
  const prs = await rest(`/pulls?state=open&head=agentschools:${BRANCH}&base=main&per_page=100`);
  requireSafe(prs.length <= 1, 'Unexpected multiple generator PRs.');
  if (prs[0]) {
    candidatePR(prs[0], bot);
    const state = await graphql('query($n:Int!){repository(owner:"agentschools",name:"cloudflare-dev-school"){pullRequest(number:$n){autoMergeRequest{enabledAt}}}}', { n: prs[0].number });
    requireSafe(!state.repository.pullRequest.autoMergeRequest, 'Existing PR has auto-merge armed; let it finish or disarm it manually before refreshing.');
  }
  const previous = await maybeRef();
  if (previous && prs.length === 0) await retainedMergedBranch(previous, bot, base);
  // Reset only an unarmed App-owned PR or a verified retained merged head.
  // The shared workflow concurrency group serializes publication and merge decisions.
  if (previous) {
    requireSafe((await maybeRef()).object.sha === previous.object.sha, 'Generator branch changed during publication.');
    await rest(`/git/refs/heads/${BRANCH}`, { method: 'PATCH', body: JSON.stringify({ sha: base, force: true }) });
  } else await rest('/git/refs', post({ ref: `refs/heads/${BRANCH}`, sha: base }));
  // This API signs as the authenticated App and compares the branch head atomically.
  const created = await graphql(`mutation($input:CreateCommitOnBranchInput!){createCommitOnBranch(input:$input){commit{oid}}}`, {
    input: {
      branch: { repositoryNameWithOwner: REPO, branchName: BRANCH }, expectedHeadOid: base,
      message: { headline: 'chore: refresh harness data', body: message(process.env.GITHUB_RUN_ID, process.env.GITHUB_RUN_ATTEMPT, base, hash(after)).split('\n\n')[1] },
      fileChanges: { additions: [{ path: DATA, contents: Buffer.from(after).toString('base64') }] },
    },
  });
  const sha = created.createCommitOnBranch.commit.oid;
  const verified = await rest(`/commits/${sha}`);
  requireSafe(sameBot(verified.author, bot) && sameBot(verified.committer, bot) && verified.commit.verification?.verified, 'App commit was not attributed and signed as configured; publication stopped.');
  dataOnly((await rest(`/compare/${base}...${sha}`)).files);
  const body = `Daily harness research. Review the data and cited sources: passing tests cannot establish that prices or policies are factually correct.\n\nGeneration: https://github.com/${REPO}/actions/runs/${process.env.GITHUB_RUN_ID}\nData SHA-256: ${hash(after)}\n\nNative auto-merge is separately opt-in and requires enforced current-head lint/test checks; see docs/harness-refresh.md.`;
  if (prs[0]) await rest(`/pulls/${prs[0].number}`, { method: 'PATCH', body: JSON.stringify({ body }) });
  else await rest('/pulls', post({ title: 'chore: refresh harness data', head: BRANCH, base: 'main', body }));
  console.log(`Published ${sha} with the App token for both branch update and PR creation/update.`);
}

async function mergeCandidate(enable) {
  identity();
  requireSafe(process.env.HARNESS_AUTO_MERGE_ENABLED === 'true', 'Setup required: HARNESS_AUTO_MERGE_ENABLED is not true. See docs/harness-refresh.md.');
  const bot = identity();
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  requireSafe(event.repository?.id === REPO_ID && process.env.GITHUB_REPOSITORY === REPO, 'Unexpected event repository.');
  const run = await rest(`/actions/runs/${event.workflow_run.id}`);
  requireSafe(run.pull_requests.length === 1, 'Expected one associated PR for this CI run.');
  const pr = await rest(`/pulls/${run.pull_requests[0].number}`);
  candidatePR(pr, bot);
  const sha = pr.head.sha;
  const workflow = await rest('/actions/workflows/ci.yml');
  const jobs = await rest(`/actions/runs/${run.id}/attempts/${run.run_attempt}/jobs?per_page=100`);
  const checks = await rest(`/commits/${sha}/check-runs?per_page=100`);
  const runs = await rest(`/actions/workflows/${workflow.id}/runs?event=pull_request&head_sha=${sha}&per_page=100`);
  requireSafe(jobs.total_count <= 100 && checks.total_count <= 100 && runs.workflow_runs.length > 0, 'Incomplete CI results.');
  currentCI(run, workflow, sha, jobs.jobs, checks.check_runs, runs.workflow_runs[0]);
  const commit = await rest(`/commits/${sha}`);
  const runId = /^Harness-run: ([1-9]\d*)$/m.exec(commit.commit.message)?.[1];
  requireSafe(runId, 'Missing generation provenance.');
  const generation = await rest(`/actions/runs/${runId}`);
  const generationWorkflow = await rest('/actions/workflows/refresh-harnesses.yml');
  requireSafe(generation.workflow_id === generationWorkflow.id, 'Wrong generator workflow identity.');
  const base = (await rest('/git/ref/heads/main')).object.sha;
  const text = await content(sha);
  requireSafe(text === canonicalData(text) && substantive(await content(base), text), 'Noncanonical or date-only data.');
  provenance(commit, bot, base, generation, hash(text));
  const comparison = await rest(`/compare/${base}...${sha}`);
  requireSafe(comparison.total_commits === 1 && comparison.status === 'ahead', 'Expected exactly one generated commit.');
  dataOnly(comparison.files);
  const result = await graphql(`query($n:Int!){repository(owner:"agentschools",name:"cloudflare-dev-school"){
    autoMergeAllowed squashMergeAllowed ref(qualifiedName:"refs/heads/main"){branchProtectionRule{
      pattern requiresStatusChecks requiresStrictStatusChecks isAdminEnforced allowsForcePushes allowsDeletions
      bypassPullRequestAllowances(first:1){totalCount} requiredStatusChecks{context app{databaseId}}
    }} generator:ref(qualifiedName:"refs/heads/chore/refresh-harnesses"){branchProtectionRule{
      pattern isAdminEnforced restrictsPushes pushAllowances(first:2){totalCount nodes{actor{__typename ... on App{databaseId}}}}
    }} pullRequest(number:$n){id headRefOid autoMergeRequest{enabledAt}}
  }}`, { n: pr.number });
  protectedMain(result.repository, bot);
  requireSafe(result.repository.pullRequest.headRefOid === sha, 'PR head changed during validation.');
  if (!enable) { console.log(`Eligible current head ${sha}; native auto-merge may be armed.`); return; }
  requireSafe(process.env.APP_TOKEN, 'Missing separately scoped App token.');
  const policy = await rest('/check-runs', post({ name: 'harness-policy', head_sha: sha, status: 'in_progress', output: { title: 'Harness policy verified; arming native auto-merge', summary: 'Identity, signed provenance, JSON-only diff, current CI and enforced protection passed.' } }));
  // GitHub checks the expected head atomically and continues to enforce checks/reviews.
  // Never use mergePullRequest, gh pr merge, --admin, approvals, or a custom merge fallback.
  await graphql(`mutation($id:ID!,$sha:GitObjectID!){enablePullRequestAutoMerge(input:{pullRequestId:$id,expectedHeadOid:$sha,mergeMethod:SQUASH}){pullRequest{number}}}`, { id: result.repository.pullRequest.id, sha }, process.env.APP_TOKEN);
  requireSafe((await rest(`/pulls/${pr.number}`)).head.sha === sha, 'Head changed after arming; policy check remains pending.');
  await rest(`/check-runs/${policy.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'completed', conclusion: 'success', output: { title: 'Harness policy passed', summary: 'Native auto-merge armed for the validated current head. GitHub still enforces all required checks and reviews.' } }) });
  console.log(`Native auto-merge requested for PR #${pr.number} at ${sha}.`);
}
export async function main(mode) {
  if (mode === 'validate') {
    const candidate = canonicalData(readFileSync('candidate/harnesses.json', 'utf8'));
    writeFileSync(DATA, candidate);
  } else if (mode === 'publish') await publish();
  else if (mode === 'check' || mode === 'enable') await mergeCandidate(mode === 'enable');
  else throw new Error('Expected validate, publish, check, or enable.');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv[2]).catch(error => { console.error(error.message); process.exitCode = 1; });
}
