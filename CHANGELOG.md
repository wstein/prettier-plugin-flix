# Changelog

User-facing changes to Prettier Plugin for Flix. Plugin releases have their own version numbers. Tested Flix versions are listed with the relevant release.

## [Unreleased]

### Formatting changes

- Keep a blank line after the opening brace of a `mod`, `trait`, `instance` or
  `enum` when the source has one, and insert exactly one when the body has at
  least 50 members and has none. Several blank lines become one; an existing
  blank is never removed. Shorter blocks without a blank stay tight. Existing
  files may gain a blank after `{` on large declaration blocks.
- Indent a wrapped match-arm guard one level deeper than the arm body.
- Indent a wrapped `with` constraint list one level deeper than the body,
  members, or continued arrow parameters. Existing Flix files with wrapped
  trait constraints may reformat on upgrade.
- Normalize cons `::` chains in expressions and patterns: a chain stays tight
  only when every operator is tight and the chain fits; otherwise the chain is
  fully spaced, and a tight chain that does not fit wraps. Existing files may
  re-space or wrap long or mixed cons chains. `use` path `::` stays tight.
- Preserve source blank lines between declarations, including after import and use statements. Collapse multiple blank lines to one.
- Wrap long function types at arrows, long trait constraints between entries, and long record and schema row tails before the pipe.
- Preserve vertical Datalog rules and wrap long query, solve, and inject lists between clauses or entries.
- Wrap oversized calls with trailing lambdas while keeping the call head and lambda together when they fit.
- Keep a return type arrow chain of two or more arrows on one line when it
  fits: it moves as a whole to its own continuation line, and a short `with`
  list follows in the same column. A single arrow, and arrows in parentheses,
  wrap as before. Existing files may reformat signatures whose chain wrapped
  at each arrow.

### Fixes

- Recognize ANTLR `*Context` class names when a bundler renames the second
  grammar's copies to `*Context2`, so the Playground dual-grammar bundle
  formats instead of falling through to a flat token dump.

- Keep signature effect-set breaks stable when a hugged `=` body would not
  fit on the continuation with the set, so the first pass already joins the
  set to the return type ([#92](https://github.com/wstein/prettier-plugin-flix/issues/92)).
  Count lead comments on `=` (and the gap before an own-line comment); count
  a hugged body only when `placeBody` keeps it on the `=` line across passes,
  including the gap when that first line is only the first body token before
  an own-line break. Both #201 repros stay idempotent at print widths 20..160
  ([#201](https://github.com/wstein/prettier-plugin-flix/issues/201)).
- Skip match-arm arrow alignment when padding would wrap a compact body onto
  the next line ([#154](https://github.com/wstein/prettier-plugin-flix/issues/154)).
- Keep map, record and match alignment stable when a block comment leads a
  map key, record field or match `case`, and do not break a list only
  because a block comment ends its source line before a `,` or `;`, so
  those layouts stay idempotent ([#137](https://github.com/wstein/prettier-plugin-flix/issues/137),
  [#187](https://github.com/wstein/prettier-plugin-flix/issues/187)).
- Keep map and record arrow/`=` alignment stable when a line comment sits
  before a separator that also carries a line comment, so the first format
  already matches the second.
- Soften end-of-line block comments only in a hugged trailing-lambda head
  (parameters and match-lambda pattern) when choosing whether to hug, so the
  choice matches a later pass; arrows and ordinary bodies keep those breaks.
- Preserve token boundaries beside comments around access dots, double colons, and cons operators.
- Account for actual indentation when aligning nested map entries, record fields, and match arms.
- Keep leading own-line comments from forcing a binary or operator chain to wrap, and keep caret-marker layouts idempotent.
- Keep signature breaks stable when record parameters wrap.
- Keep a space between an arity slash and a block comment, so `A/ /* c */ 1` no longer prints as the unparsable `A//* c */ 1`.
- Keep layouts stable across passes for block comments in function types, row tails, declaration heads and calls, and for trailing lambdas in pipeline steps. Indent the continuation after a line comment glued to an access dot or a tight `::`. Files with block comments at line ends may reflow once.
- Soften trailing block-comment breaks in match arms only while measuring arrow alignment, so a block comment that ends its line after `=>` stays broken across passes.
- Keep single-statement blocks that the source wrote on several lines vertical inside a trailing lambda that hugs its call, such as `xs |> List.map(x -> {` with the body on its own line. A trailing lambda whose first line fits hugs its call on the first pass, as it did on the second.
- After a mismatched or unclosed delimiter, still format valid sibling definitions and Datalog rules, and clear the Playground preview when recovery cannot format.

### Playground and verification

- The Playground synchronizes vertical scrolling between the input and
  formatted preview by default. The **Sync scroll** toolbar toggle turns it off.
- Share Playground repros with a link to their original source. Use **Load from
  GitHub…** to open a file pinned to a commit and jump to the lines in its link.
- Show the configured line-width guide in Playground input and formatted
  previews, including embedded examples.
- Reject a formatter change that tightens a spaced cons `::` chain in the
  program-preservation check; loosening tight to spaced stays allowed
  ([#176](https://github.com/wstein/prettier-plugin-flix/issues/176)).
- Run a full comment-site sweep in CI when the known-failure list or sampler
  changes, so removing an exception cannot hide a still-failing site
  ([#162](https://github.com/wstein/prettier-plugin-flix/issues/162)).
- Keep a `Changelog:` line from a commit body in the release draft even when
  it is not a formal git trailer.
- Document that `Protect main` still needs an admin-enabled required-check
  rule for `test` and Fixture documentation `build` ([#109](https://github.com/wstein/prettier-plugin-flix/issues/109)).
- Export versioned sweep results (`review:sweep --export`) and summarize new/fixed failures
  and official-example layout changes with `review:summary` (audit layout in the official-examples
  job summary; sweep diffs when base/candidate exports are provided)
  ([#206](https://github.com/wstein/prettier-plugin-flix/issues/206)).
- Optional width heatmap over those exports (R/ggplot2 or a Node SVG fallback), starting
  with the [#201](https://github.com/wstein/prettier-plugin-flix/issues/201) repros at
  widths 20 to 160 ([#207](https://github.com/wstein/prettier-plugin-flix/issues/207)).
- Report formatter timeouts separately from load failures and retry on the next edit. Associate syntax and line-width errors with their controls and give diff rows accessible line labels.
- Pin the weekly upstream Flix corpus. Require a review reason for each new or changed official example layout diff in a pull request.
- Guarantee idempotence for `printWidth` of 40 or more, except the known failures in `test/known-idempotence-failures.json`; below 40 idempotence is best effort and not supported.
- Add a Flix version control to the standalone Playground and embedded
  editors; handoff carries a non-default `flixVersion` in the URL fragment
  with line width. ([#166](https://github.com/wstein/prettier-plugin-flix/issues/166))
- Measure `coverage:syntax` against the latest supported Flix pin only
  (`0.80.0`); older pins stay format-selectable.
- Publish the fixture catalog under `/flix/0.80.0/` as well as the existing
  root URLs, with one Hugo build per version tree for a single Pages deploy.

### Compatibility

- Support Flix `0.79.0` alongside default `0.80.0` through `flixVersion` /
  `--flix-version`, with separate generated grammars. Module-level `val`
  parses only under `0.80.0`; `def val` is rejected there because `val` is
  reserved. ([#166](https://github.com/wstein/prettier-plugin-flix/issues/166),
  [PR #224](https://github.com/wstein/prettier-plugin-flix/pull/224))
- Document Prettier `overrides` for different `flixVersion` pins in one
  repository; verify both pins from the packed npm artifact; and preserve
  tokens and parse-tree shape under `0.79.0` (including handler `=`
  alignment, `prettier-ignore`, and the string-continuation diagnostic).
  Completes the first increment of
  [#166](https://github.com/wstein/prettier-plugin-flix/issues/166).
- Reject an empty `flixVersion` the same way as any unsupported value; only an omitted option keeps the default `0.80.0`.
- Declare `"engines": { "node": ">=22" }` so installers match CI and release publishing.
- Ship TypeScript declarations for the plugin default export and `recoverFormatting`.
- Add a `flixVersion` Prettier option (`--flix-version`) that selects an exact Flix compiler grammar. Unsupported versions fail clearly. ([#166](https://github.com/wstein/prettier-plugin-flix/issues/166))

## [0.1.3] - 2026-11-20

Tested with Flix 0.80.0 and Prettier 3.10.1.

### Formatting changes

- Align `=` in consecutive handler clauses and record fields, and `=>` in consecutive match arms and map entries. Blank lines and standalone comments separate groups. Alignment applies when the group fits the configured width, so existing Flix files may reformat on upgrade. ([commit][sibling-alignment])

### Playground and documentation

- Search the catalog from the toolbar. Results include the Formatting Style and Before and After pages. The README now installs the plugin from npm. ([commit][catalog-search])
- The standalone Playground starts at 100 columns. Embedded editors start at 60 and preserve explicit width overrides when opened in the Playground. The catalog sidebar groups chapters under Guide, Language fixtures, and Formatter behavior. ([PR #73][catalog-chapters])
- Add contributor guidelines and templates, and generate release-note drafts from Git tags for review before publishing. ([PR #71][community-and-release])

### Verification

- Add tests for partial formatting around invalid code and require 95% line and 90% branch coverage in CI. The README shows the measured coverage from `main`. ([badges][coverage-badges], [PR #74][recovery-coverage])

## [0.1.2] - 2026-11-20

### Formatting changes

- Extend tuple-table alignment to floating-point, decimal and regex literals, `null`, single-line string interpolations, and nested tuples and collections that fit on one line. Align floating-point and decimal values at the decimal point. ([literals][tuple-literals], [decimals][tuple-decimals], [nested values][tuple-nested])

### Fixes

- Use source indentation to tell whether a comment after an argument continues on the next line or belongs to the next argument. ([commit][comment-continuations])

### Playground and documentation

- Rename the site to **Prettier Plugin for Flix · Test Catalog** and make the layout responsive. ([commit][catalog-layout])
- Open the README example directly in the Playground. The formatting guide now documents wrapped calls, loop generators, and comment continuations. ([example][readme-example], [guide][comment-continuations])

### Distribution

- Publish `prettier-plugin-flix` to the public npm registry. The GitHub release workflow supports opt-in npm Trusted Publishing. ([npm package][npm], [workflow][trusted-publishing])

## [0.1.1] - 2026-11-20

Tested with Flix 0.80.0, including compilation of all 243 standard library sources after formatting. ([release notes][release-011])

### Formatting changes

- Preserve the declaration after a standalone `// prettier-ignore`, including inside a module. ([commit][prettier-ignore])
- Align columns in multiline collections of literal tuples when the rows fit the configured width. ([commit][tuple-tables])
- Keep short `run … with handler` expressions compact, put each wrapped `par … yield` binding on its own line, and align record fields with short expressions. ([commit][review-layouts])

### Fixes

- Keep trailing block comments attached to the preceding code, and keep repeated formatting stable around comments next to collection commas and blank lines before `par`. ([block comments][block-comments], [commas][delimiter-comments], [`par`][parallel-layout])

## [0.1.0] - 2026-11-20

First independently versioned plugin release. Tested with Flix 0.80.0 and Prettier 3.10.1, including compilation of all 243 standard library sources after formatting. ([release notes][release-010])

### Formatter

- Format Flix source through Prettier, with a default width of 100 columns. Break Datalog rules and queries at clause boundaries, put pipe operators at the start of continuation lines, and keep `with` beside the closing brace of a `run` block when possible. ([Datalog][datalog], [pipelines][pipelines], [handlers][handlers])
- Align eligible trailing comments, match arms, maps, and records. Use at least two spaces before a trailing line comment. Diagnose invalid backslash line continuations in strings. ([comment alignment][trailing-comments], [diagnostics][string-continuations])

### Playground and documentation

- Show cursor position, selection, and formatting status. Keep formatting independently parseable portions of a snippet around a syntax error. ([status][playground-status], [partial formatting][partial-formatting])
- Use four-space indentation in the web editors, with 80 columns in the standalone Playground and 60 columns in embedded editors. Publish the formatting guide with examples from test fixtures. ([widths][playground-widths], [guide][style-guide])

[Unreleased]: https://github.com/wstein/prettier-plugin-flix/compare/v0.1.3...main
[0.1.3]: https://github.com/wstein/prettier-plugin-flix/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/wstein/prettier-plugin-flix/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/wstein/prettier-plugin-flix/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/wstein/prettier-plugin-flix/releases/tag/v0.1.0
[release-010]: https://github.com/wstein/prettier-plugin-flix/releases/tag/v0.1.0
[release-011]: https://github.com/wstein/prettier-plugin-flix/releases/tag/v0.1.1
[npm]: https://www.npmjs.com/package/prettier-plugin-flix
[sibling-alignment]: https://github.com/wstein/prettier-plugin-flix/commit/da2c4d1
[catalog-search]: https://github.com/wstein/prettier-plugin-flix/commit/faccacd
[catalog-chapters]: https://github.com/wstein/prettier-plugin-flix/pull/73
[community-and-release]: https://github.com/wstein/prettier-plugin-flix/pull/71
[coverage-badges]: https://github.com/wstein/prettier-plugin-flix/pull/72
[recovery-coverage]: https://github.com/wstein/prettier-plugin-flix/pull/74
[tuple-literals]: https://github.com/wstein/prettier-plugin-flix/commit/8862615
[tuple-decimals]: https://github.com/wstein/prettier-plugin-flix/commit/94e8370
[tuple-nested]: https://github.com/wstein/prettier-plugin-flix/commit/2845bd0
[comment-continuations]: https://github.com/wstein/prettier-plugin-flix/commit/a5a1350
[catalog-layout]: https://github.com/wstein/prettier-plugin-flix/commit/4b3ec01
[readme-example]: https://github.com/wstein/prettier-plugin-flix/commit/8d6f58e
[trusted-publishing]: https://github.com/wstein/prettier-plugin-flix/commit/21a3f46
[prettier-ignore]: https://github.com/wstein/prettier-plugin-flix/commit/43ed93e
[tuple-tables]: https://github.com/wstein/prettier-plugin-flix/commit/5643363
[review-layouts]: https://github.com/wstein/prettier-plugin-flix/commit/373f00f
[block-comments]: https://github.com/wstein/prettier-plugin-flix/commit/d2dfcc9
[delimiter-comments]: https://github.com/wstein/prettier-plugin-flix/commit/1b1d412
[parallel-layout]: https://github.com/wstein/prettier-plugin-flix/commit/7d1f2a5
[datalog]: https://github.com/wstein/prettier-plugin-flix/commit/e44828b
[pipelines]: https://github.com/wstein/prettier-plugin-flix/commit/64d5157
[handlers]: https://github.com/wstein/prettier-plugin-flix/commit/e7248aa
[trailing-comments]: https://github.com/wstein/prettier-plugin-flix/commit/708f252
[string-continuations]: https://github.com/wstein/prettier-plugin-flix/commit/5466875
[playground-status]: https://github.com/wstein/prettier-plugin-flix/commit/fad95ac
[partial-formatting]: https://github.com/wstein/prettier-plugin-flix/commit/12ae844
[playground-widths]: https://github.com/wstein/prettier-plugin-flix/commit/bc3ef45
[style-guide]: https://github.com/wstein/prettier-plugin-flix/commit/1ef741b
