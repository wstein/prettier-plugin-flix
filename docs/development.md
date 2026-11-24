# Development and verification

[Return to the README](../README.md)

## Build from source

Use Node.js 22 or newer. The published package declares `"engines": { "node": ">=22" }`,
matching CI and the release publish job.

Install the locked dependencies and generate the parser before formatting:

```sh
npm ci
npm run build
npx prettier --plugin=./dist/index.js --check "path/to/**/*.flix"
```

`npm run build` generates the ANTLR parser, compiles the ReScript tuple-column
helper (`src/TupleColumns.res` → `src/TupleColumns.res.mjs`, copied into
`dist/`), then runs `tsc`. To rebuild only the ReScript piece after editing it,
run `npm run build:rescript`. The emitted `.res.mjs` is plain ESM with no
`@rescript/runtime` import; TypeScript still owns cell discovery and width
measurement in `src/comment-layout.ts`.

The local Git configuration allows npm to fetch the locked grammar over HTTPS.
To write specific files with program-preservation checks, run
`npm run format:checked -- file.flix other.flix`. It applies Prettier and
EditorConfig settings, validates the batch before writing, and writes only
changed files. It fails if a result changes the parsed program or if formatting
it a second time changes the output again.

## Architecture

It follows the standard plugin shape: a **parser** (source → AST) and a **printer** (AST → Prettier doc IR).

| Piece | Where | Notes |
| --- | --- | --- |
| Grammar | `@wstein/flix-antlr-grammar` (0.80.0 pin) plus `third_party/flix-antlr-grammar-0.79.0` | [`wstein/flix-antlr-grammar`](https://github.com/wstein/flix-antlr-grammar). `npm run generate` emits `src/generated/flix-0.80.0/` from the npm pin and `src/generated/flix-0.79.0/` from the vendored 0.79 commit. |
| Version selection | `src/flix-version.ts`, `src/grammar.ts` | `flixVersion` / `--flix-version` maps an exact compiler version to a grammar id (`0.80.0` → `flix-0.80.0`, `0.79.0` → `flix-0.79.0`). `grammarForId` loads the matching generated lexer and parser. First increment of [#166](https://github.com/wstein/prettier-plugin-flix/issues/166): explicit selection, a second pin with a confirmed syntax difference (`val`), README `overrides` for mixed pins, packed-artifact checks for both versions, and token/tree preservation under `0.79.0`. |
| Parser | `src/parse.ts` | The `antlr4ng` runtime over the selected grammar. Returns one root node that carries `flixVersion`, `grammarId`, the ANTLR parse tree, the code-point source, and the comment/line-break facts read from the hidden token channels. |
| Printer | `src/print.ts` | Shared `flix-ast` printer. Walks the parse tree with that tree's grammar token constants (`VAL` shifts later lexer indices between 0.79 and 0.80). |
| Plugin | `src/index.ts` | `languages`, `parsers.flix` (`astFormat: "flix-ast"`), `printers["flix-ast"]`, `options` (`flixVersion`), `defaultOptions`, `recoverFormatting`. |
| Types | `types/index.d.ts` → `dist/index.d.ts` | Hand-written public declarations for the plugin default export, `flixVersion` helpers, and `recoverFormatting`. Generated parser types stay out of the published API. |

## Verification

The README's coverage badges show the lines and branches exercised by the test
suite in the plugin's own code. CI requires at least 95% line coverage and 90%
branch coverage. The Pages workflow publishes the measured percentages on
`main`. Generated ANTLR code and the copied lexer base are excluded.

### Branch protection

Require these status checks on `main` (ruleset or classic branch protection),
require the checks from the latest push, and disallow force-pushes:

- `test` (workflow CI)
- `build` (workflow Fixture documentation)

The workflow YAML sets `concurrency` and job `timeout-minutes` for those
checks; enabling and tightening the ruleset itself is a repository admin
settings step (agents cannot change it).

Current ruleset `Protect main` (#109) applies to `refs/heads/main`, has no
bypass actors and blocks deletion, force-push and merge commits (linear
history, rebase merge only). Approvals are set to zero, so the ruleset does
not enforce review. Add a required status check rule for `test` (CI) and
`build` (Fixture documentation) from the latest push so a red check blocks
merge; that settings change is admin-only. The workflows Flix standard library
compilation and Official Flix examples run only for certain paths and are not
required checks.

Merge gate (repository rule, not enforced by the ruleset): do not mark a pull
request Ready or merge it without a `Review: CLEAR head=<SHA>` comment from an
independent reviewer on the exact head, and not while a `FINDINGS` review is
open or CI is red. Agents never merge; the owner does.

Run the same coverage check locally with Node.js 22:

```sh
npm run test:coverage
```

`npm test` builds the plugin and runs `test/*.test.mjs`. For every `.flix` file it checks that the formatted output

1. parses without errors,
2. has the same significant token texts (optional trailing commas aside) and the same comments,
3. has the same parse-tree shape,
4. keeps `->` arrows in the same class (field access versus arrow) and ends every Datalog constraint with a dot followed by whitespace, and
5. formats to itself (idempotence).

`test/fixture-idempotence.test.mjs` also formats every parseable fixture input
twice at print widths 40, 50, 60, 80, and 100 and asserts equality. That sweep
catches width-dependent drift that a single pinned Output block can miss.

To run the same checks over any directory:

```sh
node scripts/check-corpus.mjs <dir-or-file>...
```

The corpus check fails if it finds no Flix source or skips every input.

After building, `npm run coverage:syntax` reports named lexer token types, parser rules (including a Datalog breakdown), and labeled alternatives seen in parseable fixture inputs and local Flix files. Pass corpus paths after `--` for a separate report. Coverage always uses the **latest** supported Flix pin (`DEFAULT_FLIX_VERSION`, currently `0.80.0`): older pins remain selectable for formatting, but the gate tracks the current grammar surface. The denominators come from that generated grammar and include named token types that may be internal or used only for error handling. The fixture mutation tests change known-good outputs and verify that the shared program-preservation checks reject the changes.

On pull requests and main, `npm run coverage:syntax -- --check` requires the Markdown fixtures alone to reach at least 95% of parser rules and 95% of labeled alternatives against the latest pin. The lexer-token counts are informational because the vocabulary includes internal and error tokens. Some fixtures are standalone syntax examples adapted from upstream tests and may rely on surrounding definitions to type-check.

For layout decisions, prefer the [Flix language documentation](https://doc.flix.dev/) and hand-written upstream tests and examples. Wrapped list constructors follow the leading `::` layout shown in [the railroad example](https://github.com/flix/flix/blob/4022083acf86ab8b92308f2fb47ae615d5088de0/examples/datalog/railroad-network.flix#L49). The built-in formatter is recorded separately as a comparison.

## Versioned fixture documentation

The Pages site keeps stable root URLs such as `/formatting/` and `/playground/` and
also publishes the same catalog under `/flix/<exact-version>/` for every pin in
`SUPPORTED_FLIX_VERSIONS` ([`src/flix-version.ts`](../src/flix-version.ts)),
currently `0.79.0` and `0.80.0`. This is one site with per-version subtrees, not
separate deployments.

**Shared vs split.** Hugo content (`docs/content/`), the style guide, and the
exported fixture JSON are shared across builds. Only `baseURL` and
`params.flixDocVersion` change per tree: embedded editors and the Playground
default to that pin. Search, chapter nav, and asset URLs stay inside the
catalog via RelPermalink. Root URLs mirror the latest pin (`0.80.0`);
`/flix/0.80.0/` is the same catalog under an explicit version prefix.
`/flix/0.79.0/` is for readers on the older grammar. Unpinned fixtures still
bake their static preview with the plugin default; when the catalog selects a
different pin, Live re-formats under that pin instead of keeping the bake.
Fixtures whose `minVersion` / `maxVersion` exclude the catalog pin are omitted
from that tree (and from root when they only apply to an older pin), so
0.80-only cases such as module-level `val` do not appear under `/flix/0.79.0/`.

**Switcher.** The toolbar Flix control rewrites the path between the root
catalog (latest) and `/flix/<version>/...`, keeping the page after the prefix.
Fixtures that pin `flixVersion`, or that set `minVersion` / `maxVersion`, show a
badge when they are in range. Prefer pinned 0.79 cases when checking older
syntax; most fixtures omit the range and apply under every supported pin.

**Playground examples.** Fixture front matter may carry `minVersion` /
`maxVersion` (from-version, or an inclusive from–to range). The standalone
Playground and each versioned catalog use the same range filter — syntax-pin
filtering only, not a feature matrix.

`npm run docs:build` runs one Hugo build for the root and one for each
versioned catalog, stages them in the system temporary directory, then
assembles `docs/public` for a single Pages deploy. Each catalog has its own
`sitemap.xml`. New tested pins join `SUPPORTED_FLIX_VERSIONS` and then appear
automatically under `/flix/<version>/`.

## Verify the Playground in Chromium

The fixture documentation workflow runs a Playwright smoke test against
`docs/public` before uploading it to Pages. It checks live formatting, cursor
and error status, partial formatting and recovery, and Unicode handoff from
an embedded editor with default and overridden line widths. It also checks
that an embedded workbench frees its editor views when it leaves the viewport
margin and restores its draft, undo history and options on return. A focused
workbench stays active until focus leaves it. A cold Playground
loads only the selected Flix grammar. Changing versions loads the other grammar
on demand, and the worker reuses both until it is restarted. The docs build
checks the shared formatter code plus each selected grammar against the 2 MiB
uncompressed budget.

With the development dependencies and the fixture workflow's Hugo version
installed, run:

```sh
npx playwright install chromium
npm run docs:build
npm run docs:test:browser
```

To use a local Chromium binary, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.
The test starts its own loopback server at the same URL prefix as Pages.

### Measure embedded editor retention

Build the version-filtered catalog and serve the generated `docs/public` at
the GitHub Pages URL prefix. Use a Python 3 static server on loopback.

```sh
npm run docs:build
site_root=$(mktemp -d)
ln -s "$PWD/docs/public" "$site_root/prettier-plugin-flix"
python3 -m http.server 1313 --bind 127.0.0.1 --directory "$site_root"
```

Run the measurement from a second terminal.

```sh
node scripts/measure-embedded-playground.mjs \
  http://127.0.0.1:1313/prettier-plugin-flix/expressions/
```

The script opens three fresh Chromium pages at 1280 × 800. It samples at the
top of the chapter before scrolling, after visiting every fixture, and after
each of three further passes. Each sample follows a garbage collection and
reports the page's JavaScript heap, DOM nodes, JavaScript event listeners,
mounted workbenches, and worker count. Heap and listener counts include the
whole page. This walkthrough uses baked previews and measures scrolling and
editor mounting.

On 2026-11-24, Chromium 156.0.8078.79 measured 93 workbenches on
`/expressions/` at commit `0751b04`. Heap values are ranges over three runs.

| At the top of the chapter | Mounted | JS heap | DOM nodes | JS listeners |
| --- | ---: | ---: | ---: | ---: |
| Initial load | 2 | 3.84–3.99 MiB | 39,468 | 188 |
| After first traversal | 93 | 12.90–12.94 MiB | 64,852 | 7,663 |
| After three further traversals | 93 | 13.02–13.05 MiB | 64,852 | 7,663 |

Each new workbench adds to the retained heap and listener counts as the
chapter is visited. Listener and node counts stayed flat on revisits. The
largest observed heap increase after the first traversal was about 118 KiB
over the next three passes. The initial mount cost suggests prototyping
offscreen teardown. Compare the retained heap and the cost of restoring a
workbench, including edited input and settings, with the measurements above.

## Review sweeps

`npm run review:sweep -- <command>` runs the sweeps a reviewer would otherwise rebuild by hand. It runs
the plugin in `dist/` (run `npm run build` first) and needs no packages beyond the repository's own.
Every command prints its run time. `--help` lists the options.

| Command | What it does | Time (fixtures, one process) |
| --- | --- | --- |
| `idempotence` | Formats `test/*.flix` and every fixture input at widths 40, 50, 60, 70, 80, 100, 120 and 160, twice. Prints each failing file and width with the smallest input and the first and second output as a diff. | about 5 s |
| `sites` | Inserts a comment at each token (`// note`, `/* note */`, or `// own` on its own line) and formats at widths 40, 60 and 100. `--every N` checks every Nth site (default 1, all of them). | about 25 s with `--every 6`; all sites: about 15 minutes in one process, 8 minutes as three parallel `--shard k/3` processes |
| `regression --base <git-ref>` | Builds the plugin of the ref in the system temporary directory (from `git archive`; the working tree stays as it is) and compares its output with the current build at widths 40, 60, 80, 100 and 120. Prints the number of differences per file and width and the diff hunks. Always exits 0. | about 5 s |
| `all --base <git-ref>` | The three in turn. | |

Pass directories or files after the command, or set `FLIX_STDLIB_DIR`, to sweep more inputs, for example
the Flix standard library (`idempotence`, 243 files at eight widths: about 7 minutes). The sources are only read. The repository's own inputs stay in the run;
`--no-repo` leaves them out. `--shard k/n` splits the inputs over parallel processes, `--json <file>`
writes the failures (unchanged interface). `--export <file>` writes a versioned result document with one
outcome per planned case; see [Sweep result export](#sweep-result-export).

The comment-site test (`test/comment-sites.test.mjs`) uses the same code on a sample: every sixth site
and every tight `.` or `::`, with the form and width changing from site to site. `COMMENT_SITES_EVERY=1`
checks every site in every form and width.

Known failures live in `test/known-comment-site-failures.json` (comment sites) and
`test/known-idempotence-failures.json` (idempotence sweep). An entry names the file (relative to `test/`),
the width, the comment form and token index (comment sites), the kind (`unparsable` or
`not-idempotent`) and the issue (`#123`). The sweep and the test treat the list as follows:

- A failure that is not listed fails the run. The test sees only the sites it samples plus the listed
  ones, so removing an entry hides that site from `npm test`: before removing entries, run the full
  `npm run review:sweep -- sites` (three `--shard k/3` processes) and state the result in the PR.
- A listed failure must keep failing in the listed way. When a fix makes it pass, the run fails with
  `known failure now passes: remove it from the list (issue #123)`. Remove the entry in the fix.
- A listed comment-site entry that was not run (not planned, or its variant no longer parses) fails
  with `listed site not run`.
- Removing a known entry still leaves `npm test` green for sites outside the sample ([#162](https://github.com/wstein/prettier-plugin-flix/issues/162)).
  Before dropping entries, run the full `sites` sweep (three `--shard k/3` processes).
  Pull requests that touch that list, `test/comment-sites.test.mjs`,
  `test/lib.mjs`, `test/fixtures/**`, `src/**`, `scripts/review-sweep.mjs`,
  `scripts/review-sweep-lib.mjs` or the workflow file also run that full sweep
  in CI (`Comment sites full sweep`, three shards, 8 to 22 minutes each on
  GitHub runners). It is not a required check, so a red run does not block merge.
- Entries are matched by token index. After a fixture input changes, regenerate the affected entries:
  run `npm run review:sweep -- sites --json out.json` and copy the failures that belong to an open issue.

### Stdlib idempotence in CI

The workflow `Stdlib idempotence` (`.github/workflows/stdlib-idempotence.yml`) formats the Flix 0.80.0
standard library (243 files from a sparse checkout of `flix/flix` at `v0.80.0`) at the eight widths, twice, with
`npm run review:sweep -- idempotence --no-repo` in three `--shard k/3` jobs (`node --max-old-space-size=1100`).
A file that is not idempotent and not listed in `test/known-idempotence-failures.json` fails the shard
(exit 1; the log names file and width and shows the smallest input and the output diff). Each shard writes its
run count and failures to the step summary. It is not a required check.

- Trigger: pull requests that touch `src/**`, `scripts/review-sweep.mjs`, `scripts/review-sweep-lib.mjs`,
  `test/known-idempotence-failures.json`, `test/lib.mjs`, `test/fixture.mjs`, `package.json`, `package-lock.json`,
  `rescript.json` or the workflow file; `workflow_dispatch`. The sweep is 1944 runs (648 per shard). Measured: about
  4 minutes per shard locally; on GitHub runners (one run, PR #220) the sweep took 122.5 s, 235.9 s and 190.7 s
  and the three jobs 2.3 to 4.2 minutes.
- Reproduce locally: `npm run build`, then
  `FLIX_STDLIB_DIR=<flix checkout>/main/src/library node --max-old-space-size=1100 scripts/review-sweep.mjs idempotence --no-repo`
  (add `--shard 1/3` to run one part).
- A red run is a formatter regression on real code. Fix the formatter; do not add a known entry unless the owner
  accepts the failure and an issue exists. Widths below 40 are not swept (unsupported, see "Blocking findings" below);
  the sweep default starts at 40.

### Pair and triple test

`npm run review:pairs -- [options]` (`scripts/comment-pairs.mjs`) inserts several comments at once, where
`review:sweep sites` inserts one. For a seeded sample of `test/*.flix` and fixture inputs it picks two (pair) or
three (triple) distinct comment sites, gives each a form (`// note`, `/* note */` or `// own`), and formats the
result twice at each width. The sample is a pure function of `--seed`, so a failure is reproduced with the printed
seed. Pairs and triples use separate random streams: the pairs do not change with `--triples`.

| Option | Default | Meaning |
| --- | --- | --- |
| `--pairs <n>` | 5000 | combinations of two comments |
| `--triples <n>` | 3000 | combinations of three comments (0 skips them) |
| `--seed <n>` | 1 | seed, 0 to 4294967295 |
| `--widths <a,b>` | 40,60,100 | `printWidth` values; widths below 40 only with this option, best effort and not supported |
| `--forms <list>` | line,block,own | forms to draw from |
| `--only <text>`, `--no-repo`, `--json <file>`, `--max <n>` | | as in `review:sweep`; extra paths are added as inputs |

The defaults run about 23000 runs (each formats at least twice) in about 100 seconds (one process, build first with `npm run build`). A run
passes when the output parses, keeps tokens, comments, parse-tree shape and token classes, and a second pass
changes nothing. The command prints the number of runs, the combinations skipped because the variant does not
parse, and the failures by kind; for a non-idempotent run it adds the comment-kind changes of pass 1
(for example `lead:inline -> lead:line-start`). The exit code is 0 when no run failed, 1 when one failed and 2 for
invalid options. The pair test has no known-failure list: every failure fails the run.

`npm run review:kinds` (`scripts/comment-kinds-report.mjs`) is the detector behind that report. It names the kind
of each comment (attached before or after a token; own line, line start, line end or inline) in the source, in pass 1
and in pass 2, and counts every change of kind over the repository inputs (`--sites` adds comment-site variants at widths 40, 60 and 100,
`--widths` sets the widths). It exits 0 when every run is idempotent, 1 when one is not and 2 for invalid options, an unreadable path or an error while formatting (the formatter throws);
`--help` prints the usage and runs nothing. `--every <n>` (default 6) samples the site variants. Both tools call the built plugin in `dist/`; they
change no formatter code.

## Sweep result export

`--export <file>` writes a versioned JSON document (`schemaVersion: 1`) that other tools can consume
(R heatmaps, historical queries, the pull-request summary). The existing `--json` failure list stays
as it is.

| Field | Meaning |
| --- | --- |
| `command` | `idempotence`, `sites`, or `regression` |
| `createdAt` | ISO timestamp of the export |
| `formatter.revision` / `formatter.dirty` | `HEAD` of the plugin that produced the run, and whether the tree was dirty |
| `corpus.revision` | Plugin checkout when the corpus is the repo; with external paths the fingerprint identifies the input set |
| `corpus.inputCount` / `inputs` / `paths` / `fingerprint` | Input count, the input names, optional CLI paths, and a hash of those names (`\\0`-separated) |
| `config` | `widths`, `every`, `shard`, `base`, `only`, `repo`, optional `seed` and `known` |
| `cases` | One record per planned case: `id`, `file`, `width`, optional `form`/`token`, `status` (`pass` / `fail` / `skipped`), optional `kind` and `reason` |

Stable case ids use the same key as known-failure entries: `file|width|form|token` (idempotence uses
`plain` and `-` for the form and token). Skipped cases carry a reason (for example `variant does not parse`).

`review:summary --merge` requires a complete `1/n`…`n/n` set and `corpus.inputs` on every shard. The
merged document has `shard: null`, `inputCount` equal to the sum of the shard counts, and a fingerprint
over the union of those input names — the same fingerprint as an unsharded export of the same inputs
(case files alone are not enough: an input may yield no cases). A missing shard is rejected.

Merge shard exports and build the review summary locally:

```sh
npm run review:sweep -- sites --shard 1/3 --export shard-1.json
npm run review:sweep -- sites --shard 2/3 --export shard-2.json
npm run review:sweep -- sites --shard 3/3 --export shard-3.json
npm run review:summary -- --merge shard-1.json shard-2.json shard-3.json --out merged.json
npm run review:summary -- --base main-sites.json --candidate merged.json --audit official-examples-audit --out summary.md
```

`npm run review:summary` classifies new failures, fixed failures, and layout-only changes when the matching
exports and audit report are provided. A run with no recorded cases, a partial shard, a base failure
missing from the candidate, a missing base export, or an incompatible configuration is marked incomplete
and never described as green.

The Official Flix examples workflow appends the **audit (layout)** section to the Actions job summary and
links the run artifact. It does not fail the job if the summary step errors. Sweep new/fixed counts appear
when you pass `--base` / `--candidate` exports (local command above, or a future sweep workflow).

## Width heatmap (optional R)

`analysis/width-heatmap/` plots before-and-after sweep exports across print widths (fixture or repro on
the vertical axis, width on the horizontal axis, one panel per formatter revision). Pass, fail, skipped,
and missing cells are distinct. The first example is the two [#201](https://github.com/wstein/prettier-plugin-flix/issues/201)
repros at widths 20 to 160.

R and ggplot2 are optional and are not a dependency of the published plugin; `npm test` covers only the Node
helpers. A Node fallback writes the same sample SVG and a `changed-widths.tsv` table. See
[analysis/width-heatmap/README.md](../analysis/width-heatmap/README.md) for the collect and render commands.

```sh
node analysis/width-heatmap/build-sample.mjs
# with R: Rscript analysis/width-heatmap/plot-width-heatmap.R --base base.json --candidate candidate.json --out analysis/width-heatmap/out/heatmap.svg
```


## Issue triage and labels

Issue forms in `.github/ISSUE_TEMPLATE/` set one static type label. The triager adds the other labels.

| Group | Labels |
| --- | --- |
| Type | `bug`, `enhancement`, `documentation`, `test-gap`, `ci`, `decision`, `epic` |
| Area | `area:formatter`, `area:recovery`, `area:playground`, `area:release-ci`, `area:tooling`, `area:parser-api`, `area:analysis` |
| Class (formatter) | `class:comment-kind`, `class:measure-leak`, `class:alignment`, `class:signature-fit`, `class:hug`, `class:cons-chain`, `class:token-boundary` |
| Reach | `reach:real`, `reach:narrow`, `reach:synthetic` |
| Output | `corrupts-program`: the output does not parse or changes the program |

Reach says where a finding shows up:

- `reach:real`: reproduces on real code (standard library, official examples) at `printWidth` 80 or more.
- `reach:narrow`: reproduces on real code only at `printWidth` 40 to 79.
- `reach:synthetic`: needs an artificial input (for example an unusual comment position) or a `printWidth` below 40.

**Triage rule.** A finding with `reach:synthetic` does not get its own issue. Record it as a line in the checklist of
the epic of its class (label `epic`). Exceptions: a finding with `corrupts-program` and every finding
with `reach:real` or `reach:narrow` get their own issue.

Existing epics:

| Epic | Collects |
| --- | --- |
| [#211](https://github.com/wstein/prettier-plugin-flix/issues/211) | `class:comment-kind` |
| [#212](https://github.com/wstein/prettier-plugin-flix/issues/212) | `class:signature-fit` |
| [#213](https://github.com/wstein/prettier-plugin-flix/issues/213) | `class:measure-leak` and `class:hug` |
| [#214](https://github.com/wstein/prettier-plugin-flix/issues/214) | test hardening (`test-gap`) |
| [#215](https://github.com/wstein/prettier-plugin-flix/issues/215) | decisions for the owner (`decision`) |

The classes `class:alignment`, `class:cons-chain` and `class:token-boundary` have no epic yet. Create the epic when
the first open line for that class exists.

**Review labels on pull requests.**

| Label | Meaning |
| --- | --- |
| `review:clear` | The independent review of the exact head is CLEAR. |
| `review:nits` | CLEAR, with open nits recorded in issues. |
| `review:blocking` | At least one blocking finding. |
| `review:findings` | The review names at least one finding. |

`review:blocking` and `review:clear` exclude each other. When the head changes, remove all review labels until a
review of the new head exists.

**Blocking findings.** The plugin guarantees idempotence for `printWidth` of 40 or more (see
[Supported print widths](formatting.md#supported-print-widths)). A finding blocks a pull request when it is one of:

- not idempotent at `printWidth` 40 or more;
- a changed program or output that does not parse;
- a regression against `main` at `printWidth` 40 or more;
- a false statement in documentation or text that has consequences;
- a test without effect, or a surviving mutation of the new logic.

A failure only below `printWidth` 40 is `reach:synthetic`. Below 40, idempotence is best effort and not supported.
Such a failure does not block and goes into the epic of its class. The sweeps check widths below 40 only with `--widths`.

### Epics

A line in an epic checklist has the form
`- [ ] <short description> (width, form, fixture path, reach)`.

- **Definition of done.** Every line has a fixture that records the width and the form, or a known-failure entry
  that names the epic. An epic closes when every line is done or moved to the section "Outside the guarantee (printWidth
  below 40)" of the epic. A batch is accepted when `npm test` passes, the comment-site sweep passes, the standard library is idempotent
  at the eight widths of `review:sweep idempotence` (set `FLIX_STDLIB_DIR`), and a mutation of the new logic fails a
  test. The pair test (`npm run review:pairs`, see Review sweeps) is not part of the acceptance yet; formatter changes in `src/` report its result.
- **Rhythm.** Work on an epic starts when it has at least 5 open lines or before a release. A finding with
  `reach:real`, `reach:narrow` or `corrupts-program` has its own issue and is worked on at once.
- **Size.** One epic per pull request. A batch closes at most 5 lines of that epic, and each
  line is closed with `Closes #n` or referenced with `Refs #n`. Tests and fixtures go in the first commit and
  the fixes follow in later commits.

## Test sources

| Source | How | Needs expected output? |
| --- | --- | --- |
| Markdown fixtures (`test/fixtures`) | Written by hand, one case per file; see [Fixtures](fixtures.md). | yes, reviewed |
| Re-spaced sources (`test/perturb.test.mjs`) | Every test source and fixture input is re-spaced at random with five fixed seeds. | no |
| Real Flix code (`scripts/check-corpus.mjs <dir>...`) | Formats every file and checks the invariants. | no |
| Scala tests of flix/flix (`scripts/harvest-scala.mjs`) | Extracts the Flix snippets embedded in `main/test/**/*.scala` into a directory for the corpus check. | no |
| Issues of a repository (`scripts/harvest-issues.mjs`) | Collects the Flix code blocks from issue bodies and comments through the GitHub REST API (default: open issues of `flix/flix` by `wstein`). | no |
| Official documentation (`npm run test:docs-examples`) | Audits code in the Flix book and website against the plugin. See [the test and review plan](official-examples.md). | reviewed layout changes only |
| Flix compiler (`scripts/oracle.mjs`) | Compiles (and tests) each source before and after formatting with the pinned `flix.jar` and requires the same diagnostics and test results. | no |

```sh
node scripts/harvest-scala.mjs <flix-checkout> scala-snippets
node scripts/harvest-issues.mjs issue-snippets          # optional GITHUB_TOKEN
node scripts/check-corpus.mjs <flix-checkout>/main/test/flix scala-snippets issue-snippets
node scripts/oracle.mjs flix.jar <flix-checkout>/main/test/flix --every 8 --pin <flix-spec>/pin.json
```

The compiler oracle compiles each file in its own throwaway project, as flix/flix does in its own suite: compiling the whole directory at once fails because the files redeclare modules, and the compiler resolves those conflicts in an order that is not stable even for unformatted input. `--control` runs the unformatted original twice to show the report is stable; it must be identical before a mismatch means anything. A report with no recognizable compiler output counts as a failed run, never as "identical". It needs Java 21 and the jar from the `flix-spec` pin; `--pin` checks the jar's SHA-256.

`.github/workflows/flix-corpora.yml` runs the corpus checks and a sample of the oracle weekly and on demand.

## Compile the formatted standard library

The **Flix standard library compilation** workflow runs on pull requests and
`main` pushes that touch formatter sources (`src/**`), weekly on a schedule, and
on demand. It pins Flix to `v0.80.0` by default; override with `flix_tag` on
`workflow_dispatch`. The weekly schedule uses the latest Flix release. The
release workflow runs the same steps with its own `flix_tag` input. It extracts
the sources bundled in the release JAR, compiles the original library as a
control, and compiles a separate copy after Prettier formatting. Both builds use
`--Xlib nix`, so they compile the extracted library without also loading the
copy bundled in the compiler.

The formatting step checks token and parse-tree preservation and verifies
that formatting twice gives the same result. The workflow summary records
the checked Flix version and the source and class counts.

For a local run with Java 21, Bash and unzip, use the release JAR and its tag.

```sh
npm run build
bash scripts/check-flix-stdlib.sh /path/to/flix.jar v0.80.0
```

## Flix versions

The plugin uses its own version numbers. Record the exact Flix versions
verified for a plugin release in its release notes. Flix patch releases can
change syntax, so verify each exact version before adding it to that list.

- The grammar dependency is pinned to an exact commit. Verify grammar updates
  with `npm test` and the corpus checks.
- The weekly upstream workflow (`flix-upstream.yml`) checks the grammar shipped
  by the plugin against a pinned `flix-spec` corpus. New parse failures
  fail the check. Known exceptions are listed in
  [the upstream workflow configuration](../.github/flix-upstream-parse-exceptions.json).
  The compiler oracle in `flix-corpora.yml` pins the same `flix-spec` revision
  and uses its corresponding compiler. Update both workflow pins together
  after reviewing the corpus changes.
- When another Flix version passes the compatibility checks, update the release
  notes with the verified version. Release a new package when the plugin needs
  a grammar update, a formatter change, or another package change.

## Publish a plugin release

Generate a release-note draft from the latest stable plugin tag on the target
commit's first-parent history. Run this in a checkout with full history and
tags:

```sh
git fetch --tags origin
npm run --silent changelog:draft -- origin/main > release-notes.md
```

The command defaults to `HEAD` and accepts an optional second argument for an
explicit base tag. It uses scoped Conventional Commit subjects, prefers
`Changelog:` trailers when present, and puts older unprefixed commits under
**Other changes to review**.

Review the draft before publishing. Combine related changes, call out layout
changes that can reformat existing files, and add the exact tested Flix
versions. Promote the reviewed entries from **Unreleased** in
[CHANGELOG.md](../CHANGELOG.md) as part of the version and lockfile update.

After the release commit lands on `main`, create a GitHub draft release with
the reviewed notes and set its target to that commit's full SHA. The workflow
checks for an Unreleased heading and notes under the version being built. Run
**Publish plugin release** from the Actions tab on `main` with the same SHA in
`source_commit`. The workflow requires an existing draft with release notes
targeting that SHA. Before packing it re-runs the advertised gates
(`test:coverage`, syntax coverage, `docs:build`, Playwright, and the pinned
Flix standard-library compile), refuses a missing `CHANGELOG.md` version
heading or a version already on npm, then publishes that one tarball.
Enable **publish_npm** only after the `npm` GitHub Environment exists with
required reviewers and the npm trusted publisher names this workflow and the
`npm` environment. The publish job uses Node 22 with npm 11.6.2 (Trusted
Publishing needs npm >= 11.5.1) and `registry.npmjs.org`. Local `npm publish` runs
`prepublishOnly` so an empty `dist/` cannot ship. Do not deprecate the
historical `0.0.0-stage` tag from the release workflow; handle that
separately if needed.
