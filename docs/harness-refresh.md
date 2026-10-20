# Scheduled harness data PRs

This change prepares automation; it does not activate it or change repository settings.
The scheduled workflow stops before research unless explicitly enabled. Missing or
unreadable merge prerequisites fail closed with a setup error. No workflow uses
`pull_request_target`, checks out generated code with an App token, approves a PR,
or calls an immediate/custom merge API.

## Why an App

PR #137 came from `github-actions[bot]` on `chore/refresh-harnesses`, targeting
`main`. Its only change was `src/data/harnesses.ts`. CI run 39312621608 and preview
run 39312621676 required approval. Since June 11, 2026, `GITHUB_TOKEN` PR events
create approval-required workflow runs. A dedicated GitHub App installation token
for **both the branch update and PR creation/update** removes that particular
approval gate. It does not bypass any organization Actions policy.

Sources: [GITHUB_TOKEN behavior](https://docs.github.com/en/actions/concepts/security/github_token),
[June 11 change](https://github.blog/changelog/2026-06-11-bot-created-pull-requests-can-run-workflows-if-approved/).

## Trust boundaries

1. Research has read-only repository access and the existing research API secret.
   It exports only a candidate JSON artifact. It never receives App credentials.
2. A fresh runner checks out the trusted workflow revision, installs its locked
   dependencies, parses/canonicalizes candidate JSON, and runs lint/tests. Research
   modifications to scripts, workflows, schemas, tests, or executable helpers never
   cross this boundary.
3. A fresh publisher checks out that same trusted revision, consumes validated JSON,
   and obtains a short-lived App token scoped to this repository and Contents/PR
   write. It makes only a one-file change with GitHub's signed
   `createCommitOnBranch` API. Both branch and PR writes use this token. The token
   action revokes the installation token at job completion. No package install,
   test, agent, candidate script, or research summary executes on this runner.
4. On completion of `CI`, a default-branch `workflow_run` reader independently checks
   the current PR and checks. Only a successful qualification reaches the credentialed
   job; that job rechecks every condition and calls `enablePullRequestAutoMerge`
   with `expectedHeadOid`. A required `harness-policy` check is pending while arming,
   then completed by this trusted job. GitHub enforces required checks and reviews at merge time.
   There is no admin bypass or merge fallback.

`harnesses.json` holds only data; `harnesses.ts` retains executable schemas/helpers
and validates JSON at import. A generated PR must have exactly one nonempty modified
JSON file, one commit directly on current main, verified App author/committer IDs,
and a signed message binding its data digest, base, generation run and attempt.
Generation must be a successful schedule/manual run of the expected workflow on main.
The gate verifies the CI workflow ID/path, PR event, repository, branch, current head,
latest run/attempt, and non-skipped successful `lint` and `test` jobs/checks from the
GitHub Actions App and that run's check suite. Missing/ambiguous/paginated results stop.

`harness-policy` solves the native API's clean-status limitation: native auto-merge
can be armed while this required policy check is pending, after lint/test have
already passed. Only a successful native mutation completes it. A failed/uncertain
mutation leaves the check pending; it never triggers an immediate merge fallback.
CI reports `harness-policy` for ordinary PRs so requiring this context does not
block them. On the reserved generator branch CI uses a different, skipped name;
only the trusted gate reports its required policy result.

A generator branch retained after merge is reusable only when its unchanged head
is the exact head of one merged App-owned PR with verified signed generation
provenance and a substantive JSON-only diff, and that merge is in current main
history. Unknown, legacy, unmerged, altered, or unverifiable heads stop publication.
The branch SHA is re-read immediately before reset; branch auto-deletion is not
required. Historical workflow reads use the publisher job's read-only Actions token;
the App receives no extra permissions.

Publication and merge decisions share one concurrency group. Publication refuses
an already armed PR. App-only protection on the generator branch prevents another
writer replacing its content after qualification. Native protection still applies
if main changes after qualification. An armed PR that becomes stale requires an
owner to manually disable its native auto-merge before the next refresh can
regenerate it. The publisher never disarms or replaces an armed PR automatically.

## Setup requires separate approval

Do **not** make these changes merely to review or merge this implementation PR.
An owner must explicitly approve and perform setup later:

1. Confirm the repository's plan supports native auto-merge and enforced branch
   protection for this **private** repository. Observed on October 20, 2026:
   `allow_auto_merge=false`, main had no branch protection; the rulesets API
   previously returned a plan-upgrade response. That does not establish the billing
   plan. If unavailable, leave auto-merge disabled; do not buy a plan or substitute
   an unprotected/custom merge.
2. Register a dedicated App and install it on **only**
   `agentschools/cloudflare-dev-school` (repository ID `1264727819`). Minimum App
   permissions: Contents write, Pull requests write, Metadata read (implicit).
   No App Actions/Checks write, Administration permission, or bypass allowance.
   The trusted merge job alone uses its job-scoped `GITHUB_TOKEN` with Checks write
   to report `harness-policy`; the App still needs only Contents/PR write.
   Verify its numeric App ID, bot user ID, and exact `<slug>[bot]` login independently.
3. Create the `harness-publisher` environment, allow deployment from **main only**,
   and store the App private key as its **environment** secret
   `HARNESS_APP_PRIVATE_KEY`. Never use a repository/organization secret with the
   same name: that would expose it to other workflows. Keep any environment review
   requirements; unattended publishing requires an explicitly approved environment
   policy. No key belongs in git, an artifact, the research job, or tests.
4. Set repository variables `HARNESS_APP_ID`, `HARNESS_APP_BOT_ID`, and
   `HARNESS_APP_BOT_LOGIN`. Existing `ANTHROPIC_API_KEY` remains research-only.
   Review and retire the old bot-owned PR/branch (including #137) before first use;
   this implementation refuses to take over a legacy or unowned branch.
5. For auto-merge, enable repository native auto-merge and squash merges. Configure
   an exact `main` branch protection rule with required `lint`, `test`, and `harness-policy` checks
   tied to the GitHub Actions App (ID `15368`), require up-to-date branches,
   enforce administrators, disable force pushes/deletion, and allow **no PR bypass
   actors**. Preserve existing review, CODEOWNERS, conversation and other rules.
   If those rules require human review, automation waits for it and never approves
   itself. Rulesets alone are deliberately not recognized by this initial gate.
6. Protect exact `chore/refresh-harnesses` with push restrictions allowing **only
   this App**, enforced for administrators. Permit its force updates, but don't
   require PRs into this generated branch. The merge gate checks this rule and the
   exact allowed App ID. Main gets no App bypass. Do not weaken existing rules to
   satisfy this setup; reconcile them with an owner first.
7. Set `HARNESS_REFRESH_ENABLED=true` only after publisher setup. First review an
   App-generated PR and confirm signed attribution, data-only diff and CI behavior.
   Keep `HARNESS_AUTO_MERGE_ENABLED` unset until **all** native and branch prerequisites
   are verified, then separately opt in with `true`. These are activation steps,
   not performed by this PR or by local tests.

The publisher uses GitHub's signed commit API rather than local git signing/key
material. If GitHub cannot sign/attribute the App's commit, publication stops.

References: [signed commit API](https://docs.github.com/en/graphql/reference/commits),
[native auto-merge](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/automatically-merging-a-pull-request),
[protected branches and availability](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches).

## Operational limits

Lint/schema/tests check structure and known policy invariants. They cannot prove
model names, prices, command behavior, sources, or vendor billing policies are
factually correct. Automatic publication/merge requires an explicit acceptance of
that research risk. Keep auto-merge off for human source review if that is unsuitable.
Research cost uses the existing scheduled Claude invocation; no new paid API or
research run is introduced by this implementation or its tests.

Draft PRs and the generator branch skip preview deployment because previews share
production D1/KV resources. The existing close-event cleanup still runs from the
default branch, including for an older preview. App merges emit normal closed/push
signals so cleanup and production deployment retain their usual lifecycle. This
PR does not execute either. A failed cleanup needs its usual operational follow-up.

To stop future publication/arming, unset the activation variables. **Already armed
native auto-merge requests must also be disabled on their PRs**; stopping the
workflow alone does not cancel them. A reset-to-main followed by a failed signed
commit can leave an existing PR with no diff; inspect that PR and rerun the next
refresh after resolving the error. Generation artifacts expire after three days;
provenance verification uses the signed commit and workflow run record, not an
expired artifact. Unknown or deleted workflow history blocks automation.

Local validation and mocked rejection tests do not demonstrate a configured App,
live branch protections, or a real native auto-merge. End-to-end activation remains
an owner-approved follow-up.
