# Changelog

User-facing changes to Prettier Plugin for Flix. Plugin releases have their own version numbers. Tested Flix versions are listed with the relevant release.

## [Unreleased]

## [0.2.1] - 2026-11-25

Tested with Flix 0.80.0 (compiler and standard library) and Prettier 3.10.1. Flix 0.79.0 is covered by grammar and formatting fixtures.

### Formatting changes

Existing files may reformat on upgrade. Run the formatter and review the diff.

- Align tuple columns within blank-line groups. Collapse repeated blank lines to one, keep standalone row comments with their rows, and resume alignment in later groups after a group that cannot align. ([PR #294][pr-294])
- Keep match arrows, record equals signs, map arrows, and handler equals signs aligned across adjacent own-line comments. ([PR #295][pr-295])
- Align map and record separators across wider gaps when the padded row, including its comma, fits the configured width. ([PR #296][pr-296])

### Fixes

- Report invalid numeric literals precisely under the Flix 0.80.0 grammar so the Playground can still format valid declarations that follow. ([commit][commit-40a6197])

### Playground and catalog

- Reduce the browser download by minifying the formatter and grammar bundles. ([commit][commit-38c08ff])
- Release embedded editors when they scroll offscreen. Restore their drafts, settings, and partial-format diagnostics when they return. ([commit][commit-dbf6070], [commit][commit-6fb87f3])
- Show example variant settings above the code. ([commit][commit-08dfe33])

## [0.2.0] - 2026-11-24

Tested with Flix 0.80.0 (compiler and standard library) and Prettier 3.10.1. Flix 0.79.0 is covered by grammar and formatting fixtures only.

### Formatting changes

Several of these changes alter the output for existing files. Run the formatter once after upgrading and review the diff.

- Put binary operators (`+`, `-`, `*`, `/`, `and`, `or`, `:::`, `<+>` and others) at the start of wrapped continuation lines, as `flix format` does. A comment after an operator keeps the trailing break. Existing files with wrapped operator chains may reformat. ([PR #276][pr-276])
- Indent a wrapped `with` constraint list once, in the same column as the body after `=`, as `flix format` does. Existing files with wrapped trait constraints may reformat. ([PR #275][pr-275], [#273][issue-273])
- Print record types, literals, patterns and updates without inner brace padding (`{x = T}`, `{x = 1 | r}`), matching Flix. Effect sets and schema braces keep a space, an open record keeps a leading space only (`{ | a}`), and a bare `{ x }` keeps block padding. Existing files with padded record braces may reformat. ([PR #249][pr-249])
- Keep one source blank line after the opening brace of a `mod`, `trait`, `instance`, `eff` or `struct`, and never add one. Remove opening blank lines in enums, and keep a blank line that separates an enum opener comment from the next case or comment. Existing declaration blocks may reformat. ([PR #250][pr-250], [PR #252][pr-252])
- Remove the blank line after the opening bracket in comment-only expression braces, parameter lists, call arguments, unit and tuple patterns, and schema braces, as `flix format` does. `List#{ /* c */ }`, `Array#{ /* c */ }` and record braces with only a comment stay tight. Existing files may reformat. ([PR #267][pr-267])
- Keep a Flixdoc comment (`///`) directly above its declaration. Existing files with a blank line after Flixdoc may reformat. ([PR #245][pr-245], [PR #255][pr-255])
- Move a return type that is an arrow chain of two or more arrows to its own continuation line when it fits there, and, when the `with` list does not fit after the chain, put it on the next line in the same column. v0.1.3 could break such signatures inside type brackets (`Order[`, `t1`, `]` on separate lines). A single arrow, and arrows in parentheses, keep the ordinary signature wrap. Existing files may reformat long signatures. ([PR #233][pr-233])
- Put spaces around list cons in expressions and patterns (`a :: b`), including single cons operators. Wrapped continuations begin with `::`. Glued comments and package qualifiers such as `pkg::Mod` keep their spacing, and `use` paths stay tight. Existing files with tight list cons may reformat. ([PR #145][pr-145], [PR #282][pr-282])
- Indent a wrapped match-arm guard one level deeper than the arm body. ([PR #151][pr-151])
- Preserve source blank lines between declarations, including after import and use statements, and collapse multiple blank lines to one.
- Wrap long function types at arrows, long trait constraints between entries, and long record and schema row tails before the pipe.
- Preserve vertical Datalog rules and wrap long query, solve and inject lists between clauses or entries. Own-line comments above `solve`, `query` or `inject` no longer force fitting clauses to wrap. Existing files in this layout may reformat. ([PR #264][pr-264])
- Wrap a record update before its base when the final field and base exceed the configured width. Existing files may reformat on upgrade. ([commit][commit-9627ee6])
- Wrap oversized calls with trailing lambdas while keeping the call head and lambda together when they fit.
- Give trailing comments that start with four or more slashes the usual two-space minimum and group alignment. Existing files may reformat.
- Where a match scrutinee has a comment after an access dot, the layout at the affected line-width boundary may change in existing files. ([PR #261][pr-261])

### Fixes

- Keep solve and query clauses stable across formatting passes when a comment moves off a semicolon. Existing files in this layout may reformat. ([PR #264][pr-264])
- Keep braced effects stable across formatting passes when a match scrutinee has a comment after an access dot. ([PR #261][pr-261])
- Limit the break after `else` to line comments, and keep a line comment after `else` in front of comments in the else branch. ([PR #225][pr-225])
- Keep short enum case lists on one line after moving an opening-brace comment. Existing files may reformat. ([PR #252][pr-252])
- Keep an own-line comment on its own line after a block comment in a match pattern. v0.1.3 inserted a blank line and moved the comment back to the `case` column. Align match arms by the printed cons pattern, so a wrapped cons pattern no longer changes the arm padding between passes. Existing files may reformat on upgrade. ([commit][commit-ce3ad45], [commit][commit-2f945dd])
- Keep signature effect-set breaks stable when a hugged `=` body would not fit on the continuation with the set ([#92][issue-92], [#201][issue-201]).
- Skip match-arm arrow alignment when padding would wrap a compact body onto the next line ([#154][issue-154]).
- Keep map, record and match alignment stable when a block comment leads a map key, record field or match `case`, and do not break a list only because a block comment ends its source line before a `,` or `;` ([#137][issue-137], [#187][issue-187]).
- Keep map and record arrow and `=` alignment stable when a line comment sits before a separator that also carries a line comment.
- Soften end-of-line block comments only in a hugged trailing-lambda head when choosing whether to hug, so the choice matches a later pass.
- Preserve token boundaries beside comments around access dots, double colons and cons operators.
- Account for actual indentation when aligning nested map entries, record fields and match arms.
- Keep leading own-line comments from forcing a binary or operator chain to wrap, and keep caret-marker layouts idempotent.
- Keep signature breaks stable when record parameters wrap.
- Keep a space between an arity slash and a block comment, so `A/ /* c */ 1` no longer prints as the unparsable `A//* c */ 1`.
- Keep layouts stable across passes for block comments in function types, row tails, declaration heads and calls, and for trailing lambdas in pipeline steps. Indent the continuation after a line comment glued to an access dot or a tight `::`. Files with block comments at line ends may reflow once.
- Soften trailing block-comment breaks in match arms only while measuring arrow alignment, so a block comment that ends its line after `=>` stays broken across passes.
- Keep single-statement blocks that the source wrote on several lines vertical inside a trailing lambda that hugs its call.
- After a mismatched or unclosed delimiter, still format valid sibling definitions and Datalog rules.
- Format correctly when both Flix grammars ship in one bundle. ([PR #224][pr-224])

### Playground and catalog

- Synchronize vertical scrolling between the input and the formatted preview by default. The **Sync scroll** toolbar toggle turns it off. ([PR #235][pr-235], [PR #239][pr-239])
- Share a repro with a link to its original source. Import a GitHub file pinned to a commit from a dialog and jump to the lines in its link. ([PR #236][pr-236], [PR #239][pr-239])
- Show the configured line-width guide in the input and the formatted preview, including embedded examples. ([PR #232][pr-232])
- Replace the input with the formatted preview using **Use formatted** on the input header. ([PR #254][pr-254], [PR #257][pr-257])
- Select the Flix version (0.79.0 or 0.80.0) with a control in the standalone Playground and embedded editors. A handoff carries a non-default `flixVersion` in the URL fragment. ([#166][issue-166])
- Hide examples whose Flix version range excludes the selected version. ([PR #269][pr-269])
- Load only the selected Flix grammar at startup, and retry a failed grammar load on the next format. ([PR #265][pr-265])
- Bound formatter worker requests, retry load failures, clear a stale preview after a timeout, and show a Not formatted status when recovery cannot produce output.
- Associate syntax and line-width errors with their controls and give diff rows accessible line labels. ([commit][commit-109f02a])
- Publish the fixture catalog for both Flix versions under `/flix/0.79.0/` and `/flix/0.80.0/`, with a version switcher. Fixtures outside a version's range do not appear in its tree. ([PR #222][pr-222], [PR #266][pr-266], [PR #270][pr-270])
- Describe how the formatter differs from `flix format`, with references, and group the catalog navigation by topic. ([PR #229][pr-229], [PR #271][pr-271], [PR #263][pr-263])
- Add the project branding kit: logo, icons, banner and social preview, shown in the README, the catalog and the Playground. ([PR #256][pr-256], [PR #258][pr-258])

### Compatibility

- Add a `flixVersion` Prettier option (`--flix-version`) that selects an exact Flix compiler grammar. Support Flix 0.79.0 alongside the default 0.80.0, with separate generated grammars. Module-level `val` parses only under 0.80.0. An unsupported or empty value fails clearly. ([PR #172][pr-172], [PR #224][pr-224], [#166][issue-166])
- Update the Flix 0.80.0 grammar to accept type kind ascriptions and match the compiler's syntax checks for function names and numeric literals more closely. ([PR #253][pr-253])
- Document Prettier `overrides` for different `flixVersion` pins in one repository, and verify both pins from the packed npm artifact. ([PR #237][pr-237])
- Declare `"engines": { "node": ">=22" }`. ([PR #149][pr-149])
- Ship TypeScript declarations for the plugin default export and `recoverFormatting`. ([PR #150][pr-150])

### Verification

- Guarantee idempotence for `printWidth` of 40 or more, except the known failures in `test/known-idempotence-failures.json`. Below 40, idempotence is best effort and not supported. ([PR #219][pr-219])
- Measure `coverage:syntax` against the latest supported Flix pin only (0.80.0). Older pins stay selectable.

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

[Unreleased]: https://github.com/wstein/prettier-plugin-flix/compare/v0.2.1...main
[0.2.1]: https://github.com/wstein/prettier-plugin-flix/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/wstein/prettier-plugin-flix/compare/v0.1.3...v0.2.0
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
[commit-ce3ad45]: https://github.com/wstein/prettier-plugin-flix/commit/ce3ad45
[commit-2f945dd]: https://github.com/wstein/prettier-plugin-flix/commit/2f945dd
[commit-9627ee6]: https://github.com/wstein/prettier-plugin-flix/commit/9627ee6
[commit-109f02a]: https://github.com/wstein/prettier-plugin-flix/commit/109f02a
[pr-145]: https://github.com/wstein/prettier-plugin-flix/pull/145
[pr-149]: https://github.com/wstein/prettier-plugin-flix/pull/149
[pr-150]: https://github.com/wstein/prettier-plugin-flix/pull/150
[pr-151]: https://github.com/wstein/prettier-plugin-flix/pull/151
[pr-172]: https://github.com/wstein/prettier-plugin-flix/pull/172
[pr-219]: https://github.com/wstein/prettier-plugin-flix/pull/219
[pr-222]: https://github.com/wstein/prettier-plugin-flix/pull/222
[pr-224]: https://github.com/wstein/prettier-plugin-flix/pull/224
[pr-225]: https://github.com/wstein/prettier-plugin-flix/pull/225
[pr-229]: https://github.com/wstein/prettier-plugin-flix/pull/229
[pr-232]: https://github.com/wstein/prettier-plugin-flix/pull/232
[pr-233]: https://github.com/wstein/prettier-plugin-flix/pull/233
[pr-235]: https://github.com/wstein/prettier-plugin-flix/pull/235
[pr-236]: https://github.com/wstein/prettier-plugin-flix/pull/236
[pr-237]: https://github.com/wstein/prettier-plugin-flix/pull/237
[pr-239]: https://github.com/wstein/prettier-plugin-flix/pull/239
[pr-245]: https://github.com/wstein/prettier-plugin-flix/pull/245
[pr-249]: https://github.com/wstein/prettier-plugin-flix/pull/249
[pr-250]: https://github.com/wstein/prettier-plugin-flix/pull/250
[pr-252]: https://github.com/wstein/prettier-plugin-flix/pull/252
[pr-253]: https://github.com/wstein/prettier-plugin-flix/pull/253
[pr-254]: https://github.com/wstein/prettier-plugin-flix/pull/254
[pr-255]: https://github.com/wstein/prettier-plugin-flix/pull/255
[pr-256]: https://github.com/wstein/prettier-plugin-flix/pull/256
[pr-257]: https://github.com/wstein/prettier-plugin-flix/pull/257
[pr-258]: https://github.com/wstein/prettier-plugin-flix/pull/258
[pr-261]: https://github.com/wstein/prettier-plugin-flix/pull/261
[pr-263]: https://github.com/wstein/prettier-plugin-flix/pull/263
[pr-264]: https://github.com/wstein/prettier-plugin-flix/pull/264
[pr-265]: https://github.com/wstein/prettier-plugin-flix/pull/265
[pr-266]: https://github.com/wstein/prettier-plugin-flix/pull/266
[pr-267]: https://github.com/wstein/prettier-plugin-flix/pull/267
[pr-269]: https://github.com/wstein/prettier-plugin-flix/pull/269
[pr-270]: https://github.com/wstein/prettier-plugin-flix/pull/270
[pr-271]: https://github.com/wstein/prettier-plugin-flix/pull/271
[pr-275]: https://github.com/wstein/prettier-plugin-flix/pull/275
[pr-276]: https://github.com/wstein/prettier-plugin-flix/pull/276
[pr-282]: https://github.com/wstein/prettier-plugin-flix/pull/282
[issue-92]: https://github.com/wstein/prettier-plugin-flix/issues/92
[issue-137]: https://github.com/wstein/prettier-plugin-flix/issues/137
[issue-154]: https://github.com/wstein/prettier-plugin-flix/issues/154
[issue-166]: https://github.com/wstein/prettier-plugin-flix/issues/166
[issue-187]: https://github.com/wstein/prettier-plugin-flix/issues/187
[issue-201]: https://github.com/wstein/prettier-plugin-flix/issues/201
[issue-273]: https://github.com/wstein/prettier-plugin-flix/issues/273
[pr-294]: https://github.com/wstein/prettier-plugin-flix/pull/294
[pr-295]: https://github.com/wstein/prettier-plugin-flix/pull/295
[pr-296]: https://github.com/wstein/prettier-plugin-flix/pull/296
[commit-40a6197]: https://github.com/wstein/prettier-plugin-flix/commit/40a6197
[commit-38c08ff]: https://github.com/wstein/prettier-plugin-flix/commit/38c08ff
[commit-dbf6070]: https://github.com/wstein/prettier-plugin-flix/commit/dbf6070
[commit-6fb87f3]: https://github.com/wstein/prettier-plugin-flix/commit/6fb87f3
[commit-08dfe33]: https://github.com/wstein/prettier-plugin-flix/commit/08dfe33
