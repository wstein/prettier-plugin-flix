# Development and verification

[Return to the README](../README.md)

## Build from source

Install the locked dependencies and generate the parser before formatting:

```sh
git config --local url."https://github.com/".insteadOf ssh://git@github.com/
npm ci
npm run build
npx prettier --plugin=./dist/index.js --check "path/to/**/*.flix"
```

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
| Grammar | `@wstein/flix-antlr-grammar` (dev dependency, pinned to an exact commit) | [`wstein/flix-antlr-grammar`](https://github.com/wstein/flix-antlr-grammar). `npm run generate` reads its `.g4` files from `node_modules`; nothing is copied into this repo. |
| Parser | `src/parse.ts` | The `antlr4ng` runtime over the generated lexer and parser. Returns one root node that carries the ANTLR parse tree, the code-point source, and the comment/line-break facts read from the hidden token channels. |
| Printer | `src/print.ts` | Walks the parse tree and builds the doc with `group`, `indent`, `line`, `softline`, `hardline`, `join`, `ifBreak`, `lineSuffix`, `breakParent`. |
| Plugin | `src/index.ts` | `languages`, `parsers.flix` (`astFormat: "flix-ast"`), `printers["flix-ast"]`, `defaultOptions`. |

## Verification

`npm test` builds the plugin and runs `test/*.test.mjs`. For every `.flix` file it checks that the formatted output

1. parses without errors,
2. has the same significant token texts (optional trailing commas aside) and the same comments,
3. has the same parse-tree shape,
4. keeps `->` arrows in the same class (field access versus arrow) and ends every Datalog constraint with a dot followed by whitespace, and
5. formats to itself (idempotence).

To run the same checks over any directory:

```sh
node scripts/check-corpus.mjs <dir-or-file>...
```

The corpus check fails if it finds no Flix source or skips every input.

After building, `npm run coverage:syntax` reports named lexer token types, parser rules (including a Datalog breakdown), and labeled alternatives seen in parseable fixture inputs and local Flix files. Pass corpus paths after `--` for a separate report. The denominators come from the generated grammar and include named token types that may be internal or used only for error handling. The fixture mutation tests change known-good outputs and verify that the shared program-preservation checks reject the changes.

On pull requests and main, `npm run coverage:syntax -- --check` requires the Markdown fixtures alone to reach at least 95% of parser rules and 95% of labeled alternatives. The lexer-token counts are informational because the vocabulary includes internal and error tokens. Some fixtures are standalone syntax examples adapted from upstream tests and may rely on surrounding definitions to type-check.

For layout decisions, prefer the [Flix language documentation](https://doc.flix.dev/) and hand-written upstream tests and examples. Wrapped list constructors follow the leading `::` layout shown in [the railroad example](https://github.com/flix/flix/blob/4022083acf86ab8b92308f2fb47ae615d5088de0/examples/datalog/railroad-network.flix#L49). The built-in formatter is recorded separately as a comparison.

## Verify the Playground in Chromium

The fixture documentation workflow runs a Playwright smoke test against
`docs/public` before uploading it to Pages. It checks live formatting, cursor
and error status, partial formatting and recovery, and Unicode handoff from
an embedded editor with default and overridden line widths.

With the development dependencies and the fixture workflow's Hugo version
installed, run:

```sh
npx playwright install chromium
npm run docs:build
npm run docs:test:browser
```

To use a local Chromium binary, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.
The test starts its own loopback server at the same URL prefix as Pages.

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

The **Flix standard library compilation** workflow runs weekly against the
latest stable Flix release. Run it manually with `flix_tag` to check an exact
release. It extracts the sources bundled in the release JAR, compiles the
original library as a control, and compiles a separate copy after Prettier
formatting. Both builds use `--Xlib nix`, so they compile the extracted
library without also loading the copy bundled in the compiler.

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
  by the plugin against the current `flix-spec` corpus. New parse failures
  fail the check. Known exceptions are listed in
  [the upstream workflow configuration](../.github/flix-upstream-parse-exceptions.json).
  The compiler oracle in `flix-corpora.yml` uses a pinned `flix-spec` revision
  and compiler.
- When another Flix version passes the compatibility checks, update the release
  notes with the verified version. Release a new package when the plugin needs
  a grammar update, a formatter change, or another package change.

## Publish a plugin release

Merge the package version, lockfile and README install-link update into
`main`, then run **Publish plugin release** from the Actions tab on `main`.
The workflow builds and tests the selected commit and publishes its prebuilt
npm tarball as a GitHub Release. It uses the commit that starts the run unless
you supply an earlier full SHA from `main`.

Prepare a draft targeting that exact commit to record the tested Flix versions
in the release notes before publication. The workflow uses the draft and its notes. It can
also create a draft with generated notes. The release becomes public after the
tarball is available.
