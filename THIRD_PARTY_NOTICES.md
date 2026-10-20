# Third-party notices

The MIT license in `LICENSE` applies to original Cloudflare Dev School material
whose rights holders authorize that license. It does not replace the licenses
of third-party code, assets, or dependencies.

## OpenCode School enrollment code

The following files contain adaptations of
[OpenCode School](https://github.com/opencodeschool/opencode.school):

- `src/lib/student-id.ts`: adapted from upstream `src/lib/student-id.ts`,
  including the student ID format and word lists.
- `src/lib/enroll-client.ts`: cipher-reveal and confetti animation adapted from
  upstream `src/pages/index.astro` and `src/styles/main.css`.

Their existing source headers identify the adaptations and retain:

```text
Copyright (c) 2026 Cloudflare, Inc.
```

These portions remain licensed under Apache License 2.0; the full text is
included in [LICENSES/Apache-2.0.txt](LICENSES/Apache-2.0.txt). Preserve their
copyright, attribution, license, and modification notices when redistributing
or modifying them. The root MIT license does not relicense these portions.

## Other assets and dependencies

The harness logos under `public/icons/agents/` originate from Cloudflare's
developer documentation; see `AGENTS.md` for their sources and the derived
`mono.svg` variants. The project license does not grant rights to third-party
logos or trademarks. Dependencies retain their respective licenses and notices.

## Review before adoption

This license proposal requires rights-holder review before merge. Maintainers
must confirm authority to license the original project material under MIT,
confirm the proposed copyright attribution, and review third-party assets and
any additional upstream notice requirements. This draft does not establish
Cloudflare, Inc. approval or an exhaustive third-party rights audit.
