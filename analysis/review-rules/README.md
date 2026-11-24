# Review rules (Flix Datalog prototype)

Opt-in experiment for [#209](https://github.com/wstein/prettier-plugin-flix/issues/209):
express formatter-review advisories as Flix Datalog over the versioned sweep
export from [#206](https://github.com/wstein/prettier-plugin-flix/issues/206).

This is **not** a release gate. Formatter releases do not depend on it.

## Rules

| Id | Meaning |
| --- | --- |
| `R1-fail-without-exception` | Sweep case with `status=fail` at `width >= 40` and no matching known-failure id |
| `R2-layout-unapproved` | Official-example `layout-change` whose current digest has no matching approval |

Exempt / non-findings (covered by fixtures):

- Known exception for the same case id (`file\|width\|form\|token`)
- Skipped sweep cases
- Failures below width 40 (unsupported for sweeps)
- Layout changes with an approval whose digest equals the current digest
- Stale approvals (other digest) still produce `R2`

## Input mapping

| Source | Relation |
| --- | --- |
| Sweep export `cases` with `status=fail` | `SweepFail(id, width)` |
| Sweep export `cases` with `status=skipped` | `SweepSkip(id, width)` |
| Known-failure list (`test/known-*.json`) | `KnownException(id)` |
| Audit `report.json` layout-change rows | `LayoutChange(caseName, digest)` |
| `docs/official-example-reviews.json` | `Approval(caseName, digest)` |

Stable case ids match the sweep export / known-failure key:
`file|width|form|token` (idempotence uses `plain` and `-`).

Findings are `{ rule, subject, evidence }`, sorted by those fields.

## Local invocation

Node mirror (default; no Flix jar):

```sh
npm run review:rules -- \
  --sweep path/to/export.json \
  --known test/known-idempotence-failures.json \
  --audit path/to/official-examples-audit \
  --reviews docs/official-example-reviews.json \
  --compare-tooling \
  --out findings.json
```

Fixture smoke:

```sh
npm run review:rules -- \
  --sweep analysis/review-rules/fixtures/sweep-mixed.json \
  --known analysis/review-rules/fixtures/known-except-wide-40.json \
  --audit analysis/review-rules/fixtures/audit-layout \
  --reviews analysis/review-rules/fixtures/reviews.json \
  --compare-tooling
```

Optional Flix prototype (pinned compiler). Set `FLIX_JAR` to a Flix 0.80.x jar;
the CLI regenerates `Main.flix`, runs `ReviewRules.flix`, and requires identical
findings:

```sh
FLIX_JAR=/path/to/flix.jar npm run review:rules -- \
  --sweep analysis/review-rules/fixtures/sweep-mixed.json \
  --known analysis/review-rules/fixtures/known-except-wide-40.json \
  --audit analysis/review-rules/fixtures/audit-layout \
  --reviews analysis/review-rules/fixtures/reviews.json
```

`npm test` covers the Node mirror, fact mapping, and CLI. The Flix jar path is
skipped in CI unless `FLIX_JAR` is set.

## Layout

| Path | Role |
| --- | --- |
| `ReviewRules.flix` | Readable Datalog rules |
| `lib.mjs` | Fact export + Node mirror + optional Flix runner |
| `run.mjs` | Opt-in CLI |
| `fixtures/` | Reported / exempted cases (stale digest, skip, width &lt; 40) |
