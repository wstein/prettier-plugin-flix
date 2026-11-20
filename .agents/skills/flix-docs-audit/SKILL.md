---
name: flix-docs-audit
description: Review Prettier differences in the official Flix book and website examples. Use for weekly audit failures, upstream example drift, formatter layout reviews, or a grouped before-and-after report.
---

# Review the official Flix examples

Work from the plugin repository root. Use the [audit guide](../../../docs/official-examples.md)
for extractor details and the [style guide](../../../docs/formatting.md) to judge
the output. Keep the audit at 80 columns with four spaces per indent so its
results are comparable with previous runs.

## Obtain a report

- For a GitHub Actions run, download its artifact into a fresh directory.

  ```sh
  audit_dir=$(mktemp -d)
  gh run download "$run_id" --repo wstein/prettier-plugin-flix \
    --name official-flix-examples --dir "$audit_dir"
  ```

- For a local run or if artifact download fails, use clean `flix/book` and
  `flix/flix.dev` checkouts. When reproducing a failure, reuse the exact
  source revisions and plugin commit from the run.
  After installing the repository dependencies, run:

  ```sh
  audit_dir="$(mktemp -d)/audit"
  npm run test:docs-examples -- "$book_checkout" "$website_checkout" "$audit_dir" \
    --baseline test/official-docs-baseline.tsv
  ```

  Exit status 1 can indicate drift, an invariant failure, or an unapproved layout
  change in review mode. Inspect the generated reports. A report that was
  never written indicates a run or setup failure.

## Triage and review

1. Read `summary.md` for outcome counts and `drift.json` for added, removed,
   and changed cases when the run had a baseline. Check the recorded revisions
   and formatting options in `report.json`.
2. Prioritize `invariant-failure`. Find the smallest expression or declaration
   that reproduces the behavior. When making a fix, add a regression fixture
   that checks the output, program fingerprint, and idempotence.
3. Inspect `needs-context` cases against their linked upstream prose.
   Snippets can omit imports, declarations, or the rest of a block. Use the
   corresponding Flix compiler and enough surrounding context before deciding
   whether the source has a syntax problem or the plugin has a parser gap.
   Keep confirmed documentation issues in their own group.
4. Open `findings.html` or `findings.md` and read the relevant before-and-after
   code. In the diff, `-` is the upstream original and `+` is the formatted
   result. Group substantive changes by type and recommend a concrete action
   for each case that needs a decision. Keep automatically explained comment
   spacing out of that shortlist unless the user asks to review it.
5. For a layout review, report the source case, the changed lines, the suggested
   rule, and the reason. Include links to the full report, and distinguish
   proposed formatter fixes from changes that should be made upstream.
   Preserve the raw inventory in `examples.json`. The audit comparison already
   ignores trailing spaces and tabs, so those need no manual review.

## Record reviewed changes

When asked to accept a change, record a case-specific reason and the current
review hash. Include the affected code and transformation types when applicable.
Use `--reviews` with the approvals file to test strict approval coverage.

If the task includes updating the baseline, review `drift.json` first. Take the
replacement `baseline.tsv` from the same reviewed run and update the workflow
source pins when adopting a new upstream snapshot. Re-run the audit against
those inputs. A baseline records observed results, while an approval records
a reviewed decision about one particular change.
