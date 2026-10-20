# Set up hello email forwarding

Status: proposed, not activated or delivery-verified. Intended route:
`hello@cfdev.school` → `zeke@sikelianos.com`.

This is an operator runbook. Merging it does not configure email. The repository
manages the website's Worker custom domain in `wrangler.jsonc`; it contains no
zone DNS or Email Routing infrastructure configuration. An HTTP Worker route or
`send_email` binding does not configure this incoming forwarding address.

## Read-only findings

Checked on 2026-10-20 against repository commit `4cd7f98`:

- `AGENTS.md` identifies Cloudflare Registrar on the personal account as the
  domain owner. No repository-specific skills or mail infrastructure code were found.
- Public NS records are `autumn.ns.cloudflare.com` and
  `leonard.ns.cloudflare.com`.
- Both authoritative nameservers returned `NOERROR` with no apex MX answers.
  Autumn also returned no apex TXT answers and `NXDOMAIN` for `_dmarc` TXT.
  Resolver `1.1.1.1` independently returned no apex MX or TXT answers.
- These observations do not prove absence of account routing rules, verified
  destinations, other mail records, or implicit SMTP delivery via A/AAAA records.
  Authenticated Email Routing state remains unknown: no Cloudflare credentials
  were available in this execution environment. No messages were sent.

Recheck before approval, preserving status/authority information rather than
interpreting empty `+short` output as proof:

```sh
dig @1.1.1.1 cfdev.school NS
dig @autumn.ns.cloudflare.com cfdev.school MX
dig @leonard.ns.cloudflare.com cfdev.school MX
dig @autumn.ns.cloudflare.com cfdev.school TXT
dig @autumn.ns.cloudflare.com _dmarc.cfdev.school TXT
```

## Inspect before changing anything

Using an existing authorized Cloudflare session, select the personal account and
confirm its `cfdev.school` zone. Read DNS records and Compute → Email Service →
Email Routing settings, routing rules, catch-all, and account destination addresses.
Retain a private before-state snapshot, including rule order, enabled flags and
DNS record values/IDs; do not commit credentials or unrelated mailbox details.

If an identical enabled route already exists, verify it instead of duplicating
it. If another `hello` rule, external MX provider, or incompatible configuration
exists, stop and agree a preservation/migration plan. Keep existing rules,
catch-all behavior, DNS and authentication policies intact. Do not enable a
catch-all for this request.

## Changes requiring separate approval

Present the actual before/after DNS records and proposed rule for approval before
any live change. Approval must also cover any verification or test email.
Credential provisioning and security-policy changes require their own approval.

1. Reuse `zeke@sikelianos.com` if already verified in this account. Otherwise,
   after approval, add it under Destination Addresses. This sends a verification
   email; Zeke must complete verification before proceeding.
2. If routing is not configured, review Onboard Domain for **Email Routing** on
   `cfdev.school`. After approval, add only the domain-specific records Cloudflare
   supplies: apex MX, forwarding SPF and routing DKIM. Preserve website records.
   If a provider conflict appears, stop; do not remove existing MX. Preserve SPF
   authorizations in a single SPF record, and review conflicts before applying.
   Do not onboard Email Sending or change DMARC for this forwarding request.
   [Domain configuration](https://developers.cloudflare.com/email-service/configuration/domains/)
3. In Routing Rules, create one exact pattern: local part `hello`, domain
   `cfdev.school`, action **Send to an email**, destination
   `zeke@sikelianos.com`, enabled after verification. Preserve all other rules
   and catch-all settings. Recheck for duplicates immediately before creation:
   the first matching rule takes precedence.
   [Rules and addresses](https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/)

## Acceptance and rollback

After approved activation, confirm routing DNS/settings are healthy, the
destination is verified and the exact rule is enabled. Re-read DNS, rules and
catch-all and compare with the private snapshot to detect unintended changes.

After separate test-send approval, send a uniquely identified message from an
independent mailbox to `hello@cfdev.school`. Have Zeke confirm receipt at
`zeke@sikelianos.com`, including subject and timestamp; inspect routing activity
and spam if missing. DNS success alone is insufficient. Record the result before
advertising the address in community or website content. This does not configure
sending/replying as `hello@cfdev.school`.
[Delivery troubleshooting](https://developers.cloudflare.com/email-service/reference/troubleshooting/)

If verification fails, report the address as unverified. For an approved rollback,
disable only the rule created here; restore any modified preexisting rule from
the snapshot. Do not delete a shared destination or disable domain-wide routing.
Restore DNS only through a separately approved rollback based on the snapshot,
after checking no other routes depend on the new records.

## PR and deployment gate

At the inspected commit, `preview.yml` runs on PR opening, including drafts, and
`scripts/preview-env.mjs` applies remote production D1 migrations. Keep this branch
without a PR until the separate preview-isolation work is confirmed safe. Recheck
the effective workflows before opening it. This document needs no deployment or
database migration. Do not run deploy, preview or remote migration commands as
validation for it.
