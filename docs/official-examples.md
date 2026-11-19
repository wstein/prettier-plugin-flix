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

- `report.json` lists each case with its source commit and line link, language,
  outcome, and any parse diagnostics. Layout candidates include a review hash.
- `changes.diff` shows the before/after differences. Both versions of each
  candidate are also saved under `before/` and `after/`.
- `node scripts/extract-flix-examples.mjs /tmp/flix-book /tmp/flix-website /tmp/flix-examples.json`
  exports the inventory without formatting.

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
    "digest": "c44e29ac4a553cb2e2d3165d8eb05b529ed6b5f38cecda1465f2614d88b85dc3",
    "reason": "Each middleware stage starts on its own line and match arrows share a column."
  }
}
```

The hash covers the original, formatted output, context and formatting options.
The audit exits with status 1 for an invariant failure, or for an unapproved
or changed layout candidate in review mode. It still writes the report.
Cases awaiting context remain visible in either mode.

## First audit

Sources were [flix/book at `64d81bd`](https://github.com/flix/book/tree/64d81bd6984ede06442ef7b63235092b9fe3c29c)
and [flix/flix.dev at `655c943`](https://github.com/flix/flix.dev/tree/655c94385f09855e88b333e98577194cedf91ce7).
The formatting options were `printWidth: 80`, `tabWidth: 4` and `useTabs: false`.

| Source | Unchanged | Layout change | Needs context | Java |
| --- | ---: | ---: | ---: | ---: |
| Book | 294 | 239 | 41 | 1 |
| Website | 7 | 12 | 5 | 0 |
| Total | 301 | 251 | 46 | 1 |

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
