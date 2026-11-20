# Audit the official Flix examples

This check compares the examples shown on [doc.flix.dev](https://doc.flix.dev/) and
[flix.dev](https://flix.dev/) with the Prettier plugin. It leaves the source
checkouts and the Markdown fixtures untouched.

## Run the audit

With Node 22+, Git and the development dependencies installed, run from the
plugin checkout:

```sh
git clone https://github.com/flix/book.git /tmp/flix-book
git clone https://github.com/flix/flix.dev.git /tmp/flix-website
npm run test:docs-examples -- /tmp/flix-book /tmp/flix-website /tmp/flix-example-audit
```

Existing checkouts work too. Use clean checkouts at the revisions you want to
review and choose a new report directory for each run. To reproduce the first
audit below, check out the listed commits before running the command.

- `examples.json` is the raw inventory with extracted code and source links.
- The comparison and baseline ignore spaces and tabs at the end of lines.
  Program-preservation checks still use the full extracted input.
- The audit and standalone Playground examples use 80 columns. Embedded
  editors start at 60 columns. The plugin defaults to 100 columns.
- Open `findings.html` after extracting the artifact for a searchable overview
  with inline diffs and separate recommendations for the formatter and the
  documentation. `findings.md` contains the same findings in Markdown.
- `report.json` lists each case with its source commit and line link, language,
  outcome, and any parse diagnostics. Layout candidates include a review hash.
- `changes.diff` shows the before/after differences. Both versions of each
  candidate are also saved under `before/` and `after/`.
- `baseline.tsv` records the state of every example. With `--baseline`,
  `drift.json` lists additions, removals and changes to that state.
- `node scripts/extract-flix-examples.mjs /tmp/flix-book /tmp/flix-website /tmp/flix-examples.json`
  exports the inventory without formatting.

GitHub Actions uploads these files in the `official-flix-examples` artifact.
The workflow runs weekly against the current upstream branches. It also runs on
relevant pull requests with fixed source revisions and can run manually with
other revisions. A changed example makes the job fail and appears in its build
summary. The artifact remains available for review.

The extractor reads fenced `flix` and `java` blocks from the book and Flix
templates referenced by `Feature` and `CodeSnippet` on the website, including
the template in the Getting Started page. It reads the cooked JavaScript
template values without executing code. Java fences are inventoried for
interop context. Case names use
`source.category.topic.slug` with ASCII kebab-case segments. Book categories
come from `SUMMARY.md` and website categories from the page. The extractor adds
suffixes such as `-02` for collisions within a category and topic.

## Test and review plan

1. Compare complete Flix snippets directly. For an expression or statement
   fragment, the audit tries a synthetic function body and marks that context
   in the report. Review it alongside the source prose because the wrapper's
   indentation affects the available width.
2. Stop on `invariant-failure`. If a parseable input formats to invalid
   syntax, changes the program fingerprint, or changes on the second pass,
   reduce the case to a Markdown regression fixture.
3. Resolve `needs-context` cases using the surrounding text and the
   corresponding Flix compiler version. These include incomplete excerpts,
   compiler diagnostics presented as examples, and potential parser gaps.
   Verify a suspected parser gap with the compiler before assigning it to the
   plugin.
4. Read each `layout-change` diff and approve it with a case-specific reason
   only after reviewing readability and teaching intent. Use reviewed fixtures
   for deliberate formatter behavior and record unresolved layout findings as
   such. A passing fingerprint check alone does not approve a layout change.

To enforce approvals, add `--reviews /path/to/reviews.json` to the audit command.
The file maps each case name to its current hash and a written reason:

```json
{
  "website.front-page.http.demonstrates-composing-multiple-http-mid": {
    "digest": "d7b2a46c534a59ffedbde0f5b571d81c1f2924e34c4073a99963da185fd0a431",
    "reason": "Each middleware stage starts on its own line and match arrows share a column."
  }
}
```

The hash covers the original, formatted output, context and formatting options.
The audit exits with status 1 for an invariant failure, or for an unapproved
or changed layout candidate in review mode. It still writes the report.
Cases awaiting context remain visible in either mode.

### Record reviewed transformations

Each reviewed example in [the assessments](official-example-assessments.json)
can include an ordered list of transformation types and the code they affect.
The HTML and JSON reports include the list when the example and its hash
match. Review a new diff before updating that hash.

- `align-trailing-comments` adjusts the gaps before neighboring comments
  within a group that fits the configured width.
- `inline-short-function-body` and `inline-short-loop-body` join a single
  expression to its header when the whole line fits.
- `layout-with-chain` keeps the first `with` with the closing brace and aligns
  subsequent clauses with that keyword when it follows the brace. Handler
  arguments can wrap within their clause.
- `leading-pipeline-operators` moves operators to the start of each step
  when a pipeline wraps.
- `final-newline` records the addition of a terminating newline.

The weekly drift check still compares the exact recorded examples. These
lists explain case-specific decisions and provide no blanket approval for
unreviewed diffs.

### Review a weekly failure

The workflow compares with [the observed baseline](../test/official-docs-baseline.tsv).
Each row records the case, its outcome and a hash covering the extracted
source, formatted bytes and any parse diagnostics. Changes to unrelated prose
can pass if they leave the examples unchanged.

1. Download the artifact and open `drift.json` for the cases that triggered the
   alert. Inspect source links in `report.json` and layout changes in `findings.md`.
2. Review new formatting with the plan above. Use `--reviews` to require a
   written reason for each layout candidate in a strict review run. A baseline
   row records an observation and is separate from that approval.
3. When accepting a new upstream snapshot, update the pinned revisions in the
   workflow and replace `test/official-docs-baseline.tsv` with the reviewed
   `baseline.tsv` from the artifact. Put the reasons for changes in the pull
   request. An invariant failure still fails the audit with any baseline.

## First audit

Sources were [flix/book at `64d81bd`](https://github.com/flix/book/tree/64d81bd6984ede06442ef7b63235092b9fe3c29c)
and [flix/flix.dev at `655c943`](https://github.com/flix/flix.dev/tree/655c94385f09855e88b333e98577194cedf91ce7).
The formatting options were `printWidth: 80`, `tabWidth: 4` and `useTabs: false`.

| Source | Unchanged | Layout change | Needs context | Java |
| --- | ---: | ---: | ---: | ---: |
| Book | 293 | 240 | 41 | 1 |
| Website | 0 | 19 | 5 | 0 |
| Total | 293 | 259 | 46 | 1 |

The 259 differences include 158 line wrapping changes, 71 spacing or
alignment changes, 14 blank-line changes, eight indentation changes, and
eight line-ending changes. The byte comparison uses the extracted snippets.
A book fence includes its last line break. A website template carries its
cooked string exactly as rendered. The report strips the synthetic function
from fragment diffs.

All 552 parseable inputs passed the program-preservation and idempotence
checks. Of those, 121 used the synthetic wrapper. Selected cases were also
checked separately with the Flix 0.80.0 compiler.

- **Keep the middleware breaks.** The HTTP layout implements the editor's
  rule that each `with` starts its own line, and the match arrows align.
  Both versions have unresolved names when compiled standalone with Flix
  0.80.0, including `Clock` and `Http`.
  [Website source](https://github.com/flix/flix.dev/blob/655c94385f09855e88b333e98577194cedf91ce7/src/lib/indexExamples.js#L3)
- **Improve the comprehension layout.** The plugin collapses three `forM`
  generators onto one line and splits the short `yield` expression. Both
  versions pass Flix 0.80.0. Keeping one generator per line makes their
  dependencies easier to read.
  [Website source](https://github.com/flix/flix.dev/blob/655c94385f09855e88b333e98577194cedf91ce7/src/lib/indexExamples.js#L269)
- **Resolve an upstream syntax discrepancy.** The website uses
  `reifyEff(f) { ... }`, which Flix 0.80.0 rejects. The book shows
  `match purityOf(f)`.
  [Website source](https://github.com/flix/flix.dev/blob/655c94385f09855e88b333e98577194cedf91ce7/src/lib/indexExamples.js#L165)
  · [Book source](https://github.com/flix/book/blob/64d81bd6984ede06442ef7b63235092b9fe3c29c/src/purity-reflection.md#L14)
- **Review book excerpts in context.** The Logger module excerpt ends before
  its closing brace. The highlighted compiler error in the validation chapter
  is output from the preceding example. Both are original inputs.
  [Logger excerpt](https://github.com/flix/book/blob/64d81bd6984ede06442ef7b63235092b9fe3c29c/src/logger.md#L36)
  · [Validation diagnostic](https://github.com/flix/book/blob/64d81bd6984ede06442ef7b63235092b9fe3c29c/src/applicative-for-yield.md#L87)
