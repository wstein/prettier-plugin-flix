---
name: flix-review-triage
description: Review a formatter pull request and triage findings in prettier-plugin-flix. Use for independent reviews, delta reviews, CLEAR carry-over, input probes and the reach of a finding.
---

# Review a formatter pull request and triage findings

Work from the plugin repository root with Node.js 22. Labels, reach levels and
the definition of a blocking finding are in
[Issue triage and labels](../../../docs/development.md#issue-triage-and-labels).
The idempotence guarantee is in
[Supported print widths](../../../docs/formatting.md#supported-print-widths).
The sweeps are described in
[Review sweeps](../../../docs/development.md#review-sweeps). Write results only
into the scratch folder, never into `/tmp`.

## Before the review

1. Read the PR text, the diff and the linked issues. Record the head SHA and
   the SHA of `origin/main`.
2. Wait until the head and `main` have been unchanged for 10 minutes. Do not
   wait in parallel with posting.
3. Check free memory before the heavy runs below.
4. Compute the patch-id: `git diff origin/main...HEAD | git patch-id --stable`.
   The first field is the `patch-id` of the header line.

## Checklist for a formatter review

Run each command on the exact head and record the command and the number.
Mark a check that did not run as "not run".

| Check | Command | Expected |
| --- | --- | --- |
| Tests | `npm test` | all pass |
| Syntax coverage | `npm run coverage:syntax -- --check` | exit 0 |
| Docs | `npm run docs:build` | exit 0 |
| Idempotence | `npm run review:sweep -- idempotence` | 0 failures not in the known list |
| Comment sites | `npm run review:sweep -- sites --every 6` | 0 failures not in the known list |
| Regression | `npm run review:sweep -- regression --base origin/main` | every difference is intended and explained |
| Standard library idempotence | `FLIX_STDLIB_DIR=<stdlib> node --max-old-space-size=1100 scripts/review-sweep.mjs idempotence --no-repo --shard k/3` for k = 1, 2, 3 | 0 new failures against `main` |
| Standard library regression | base against head at `printWidth` 80 and 100 | differences are intended |
| Compiler check | `bash scripts/check-flix-stdlib.sh <flix.jar> v0.80.0` | the formatted library compiles |
| Official examples | audit of the 599 examples, see [flix-docs-audit](../flix-docs-audit/SKILL.md) | no new failure; changed layouts have a reason |
| Mutations | at least 12 mutations of the new logic | every mutation fails a test |

Run the standard library idempotence on `main` as well. A failure counts as
new when it does not appear on `main`. For `src/` changes, run the full
`sites` sweep (three `--shard k/3` processes) when the PR removes known
entries, and `scripts/comment-pairs.mjs` after PR #196 lands.

### Mutations

- Mutate each new condition, branch and measuring site: invert it, remove it,
  change a constant by one. Record each mutation and the test that fails.
- A mutation that no test detects is a finding. It points at a missing
  fixture. The fixture must fail without the new condition.
- Measuring functions return widths and never docs. Check that no mode field
  was added to the printer and that pass 1 decides as pass 2 sees it.

## Input probe

Format the input of every new or changed fixture with the head and with
`origin/main`, at printWidth 20 to 160 (20, 40, 60, 80, 100, 120, 140, 160).
Format each result a second time. Compare:

- pass 2 equals pass 1 at printWidth 40 and above;
- the output parses and keeps tokens and comments;
- the head differs from `main` only where the PR intends it.

Try variants of the input: comments at the edges of the changed construct (line
and block), nested forms and tight `.` or `::` chains.

## Determine the reach of a finding

1. Reproduce the finding with the smallest input.
2. Find the same shape in real code (standard library, official examples):
   - reproduces at printWidth 80 or more: `reach:real`;
   - reproduces only at 40 to 79: `reach:narrow`;
   - needs an artificial input or a width below 40: `reach:synthetic`.
3. A finding with `reach:synthetic` becomes a line in the checklist of the
   collection issue (label `epic`) of its class. Create no issue of its own.
   `corrupts-program`, `reach:real` and `reach:narrow` get their own issue.
4. Check open and closed issues for a duplicate before creating an issue.
5. Set type, area, class and reach labels as described in the development
   guide.

A finding blocks when it is one of the blocking findings in the development
guide. Synthetic findings do not block.

## Review comment

Post one comment, at most 15 lines. The first line is machine-readable, with
fixed keys in this order, a 40-digit SHA, a 40-digit lowercase hex patch-id and
no markdown:

```text
Review: CLEAR head=<SHA> patch-id=<40 hex> pr=<n>
base=main <SHA> (checked)
```

Use `FINDINGS` instead of `CLEAR` when at least one finding is open. The second
line names the `main` SHA that the review used. List each finding with its
reach, the smallest input and the width. List the checks with command and
number. Check the head immediately before posting; post nothing for a stale
head. A helper sets the review labels, not the reviewer.

## Delta review, follow-up and carry-over

- A delta review checks only the diff since the last review. Name both heads.
  Run the checks that the diff affects and the mutations of changed logic.
- After a merge without CLEAR, post a follow-up review as a normal `COMMENT`
  review on the merged head.
- A CLEAR carries over to a new head when the patch-id of `src/` and
  `test/fixtures` is unchanged and CI is green (a pure rebase). Post a comment
  that names the old head, the new head and both patch-ids.
  Commits after CLEAR are limited to a rebase or a fix for review findings.
- A new head otherwise needs a new review. All review labels stay off until it
  exists.
