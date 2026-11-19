# prettier-plugin-flix

A [Prettier](https://prettier.io) plugin for [Flix](https://flix.dev) source files (`.flix`).

It follows the standard plugin shape: a **parser** (source → AST) and a **printer** (AST → Prettier doc IR).

| Piece | Where | Notes |
| --- | --- | --- |
| Grammar | `@wstein/flix-antlr-grammar` (dev dependency, pinned to an exact commit) | [`wstein/flix-antlr-grammar`](https://github.com/wstein/flix-antlr-grammar). `npm run generate` reads its `.g4` files from `node_modules`; nothing is copied into this repo. |
| Parser | `src/parse.ts` | The `antlr4ng` runtime over the generated lexer and parser. Returns one root node that carries the ANTLR parse tree, the code-point source, and the comment/line-break facts read from the hidden token channels. |
| Printer | `src/print.ts` | Walks the parse tree and builds the doc with `group`, `indent`, `line`, `softline`, `hardline`, `join`, `ifBreak`, `lineSuffix`, `breakParent`. |
| Plugin | `src/index.ts` | `languages`, `parsers.flix` (`astFormat: "flix-ast"`), `printers["flix-ast"]`, `defaultOptions`. |

## Use

```sh
npm install
npm run build            # generates the parser from the grammar dependency, then compiles with tsc
npx prettier --plugin=./dist/index.js --write 'path/to/**/*.flix'
```

To format and write specific files with verification, run `npm run format:checked -- file.flix other.flix` after building. The command uses the files' Prettier and EditorConfig settings. It validates the entire batch before writing, rejects changes to the program or unstable formatting, and writes only files whose contents differ.

From another project, install this directory next to Prettier (`npm i -D prettier github:wstein/prettier-plugin-flix`) and list it in `.prettierrc`:

```json
{ "plugins": ["prettier-plugin-flix"] }
```

The plugin defaults `tabWidth` to 4, the indentation of the Flix standard library. `printWidth` and `endOfLine` behave as in Prettier core.

## What it formats

- Declarations: `mod`, `def`, `val`, `enum`, `struct`, `trait`, `instance`, `eff`, `type alias`, annotations and modifiers.
- Expressions: calls, method calls, operator chains (wrapped after the operator), lambdas, `if`/`else`, `match`/`choose`/`select`, `let` chains, `foreach`/`forM`/`forA`, `try`/`catch`, `run`/`with`, `region`, records, collections, Datalog constraint sets, string interpolation.
- Types and patterns, including effect annotations (`\ IO`), kinds, record, schema and case-set types.
- Comments (`//`, `///`, `/* */`) are kept next to the token they were written beside; blank lines between items are preserved (at most one).

Layout decisions that depend on the source are deliberate, so that formatting is stable: a block, record, or member list that spans several lines in the source stays multi-line; one written on a single line is collapsed or wrapped only by width.

## Whitespace-sensitive tokens

Flix classifies some tokens by the whitespace around them (`->` in `s->field` versus a lambda arrow, `.` in `a.b`, `::` in `use A::B`). The printer never moves those tokens across a boundary that changes their class: field access and method dots never break, and `use Pkg::Name` stays tight.

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

After building, `npm run coverage:syntax` reports named lexer token types, parser rules, and labeled alternatives seen in parseable fixture inputs and local Flix files. Pass corpus paths after `--` for a separate report. The denominators come from the generated grammar and include named token types that may be internal or used only for error handling. The fixture mutation tests change known-good outputs and verify that the shared program-preservation checks reject the changes.

The version policy check:

```sh
node scripts/check-flix-version.mjs <path-to>/flix-spec/pin.json
```

## Fixtures

Formatter behavior is specified by Markdown fixtures in `test/fixtures/<area>/<case>.md`, one case per file, each with the unformatted input and the expected output:

````markdown
---
title: Let chain and match arms
flix: "0.80"               # Flix release the case was written for (quoted major.minor)
options: { printWidth: 80 } # optional Prettier options: printWidth, tabWidth, useTabs
status: pass               # pass (default) | todo | error
---

## Input

```flix
def f(x: Option[Int32]): Int32 = {let y = 1;
match x {case Some(v) => v+y
case None => y}}
```

## Output

```flix
def f(x: Option[Int32]): Int32 = {
    let y = 1;
    match x {
        case Some(v) => v + y
        case None => y
    }
}
```

```flix printWidth=30
...the same input formatted with other options...
```
````

- Exactly one `## Input` block. `## Output` has one block per option set; the first uses the front matter options, later ones add `key=value` options to the info string.
- Every fixture is also checked with the invariants above: the output must keep the program (tokens, comments, tree shape, token classes) and formatting it again must change nothing.
- `status: todo` records one known gap, so it takes exactly one Output block (split a case with several gaps, or with one option set already right, into separate fixtures). The Output block holds the *desired* result, the test passes while the formatter still differs, and fails as soon as it matches, so the status cannot go stale. Optional `issue` explains or links it.
- `status: error` has no Output block; the input must fail with a `SyntaxError`. Optional `message` is a regular expression for the error text.
- Optional front matter: `description`, `source` (where an input came from), `tags`.

After changing the printer, `npm run test:update` rewrites the Output blocks of `status: pass` fixtures from the formatter's actual output. Review the diff: it is the review of the formatting change. The loader rejects unknown keys, options and sections, so typos fail loudly.

A fixture can also record the built-in Flix formatter as an independent reference. Set `flixFormat: "0.80.0"` in front matter and add one `## Flix Format` block. Use a `flix` fence for the actual output or a `text` fence for the compiler diagnostics when `flix format` declines the input. The CLI type-checks the input first, so isolated examples that depend on a mounted package may have a diagnostic reference. The existing `## Output` blocks and the program-preservation checks still define the Prettier expectations.

```sh
npm run test:flix-format -- path/to/flix.jar path/to/flix-spec/pin.json
npm run test:flix-format -- path/to/flix.jar path/to/flix-spec/pin.json --update
```

The comparison needs a Java 21 JDK and launches one JVM for all selected fixtures. It checks the pinned compiler version and JAR digest and uses a fresh Flix instance for each fixture. When changing the pin, update the fixtures' `flixFormat` versions and regenerate the references. Review the diff for changes in Flix output or diagnostics.

## Test sources

| Source | How | Needs expected output? |
| --- | --- | --- |
| Markdown fixtures (`test/fixtures`) | Written by hand, one case per file; see Fixtures. | yes, reviewed |
| Re-spaced sources (`test/perturb.test.mjs`) | Every test source and fixture input is re-spaced at random with five fixed seeds. | no |
| Real Flix code (`scripts/check-corpus.mjs <dir>...`) | Formats every file and checks the invariants. | no |
| Scala tests of flix/flix (`scripts/harvest-scala.mjs`) | Extracts the Flix snippets embedded in `main/test/**/*.scala` into a directory for the corpus check. | no |
| Issues of a repository (`scripts/harvest-issues.mjs`) | Collects the Flix code blocks from issue bodies and comments through the GitHub REST API (default: open issues of `flix/flix` by `wstein`). | no |
| Flix compiler (`scripts/oracle.mjs`) | Compiles (and tests) each source before and after formatting with the pinned `flix.jar` and requires the same diagnostics and test results. | no |

```sh
node scripts/harvest-scala.mjs <flix-checkout> scala-snippets
node scripts/harvest-issues.mjs issue-snippets          # optional GITHUB_TOKEN
node scripts/check-corpus.mjs <flix-checkout>/main/test/flix scala-snippets issue-snippets
node scripts/oracle.mjs flix.jar <flix-checkout>/main/test/flix --every 8 --pin <flix-spec>/pin.json
```

The compiler oracle compiles each file in its own throwaway project, as flix/flix does in its own suite: compiling the whole directory at once fails because the files redeclare modules, and the compiler resolves those conflicts in an order that is not stable even for unformatted input. `--control` runs the unformatted original twice to show the report is stable; it must be identical before a mismatch means anything. A report with no recognizable compiler output counts as a failed run, never as "identical". It needs Java 21 and the jar from the `flix-spec` pin; `--pin` checks the jar's SHA-256.

`.github/workflows/flix-corpora.yml` runs the corpus checks and a sample of the oracle weekly and on demand.

## Flix versions

Flix changes quickly, so the plugin follows one rule: **the plugin's `major.minor` is the Flix release it was checked against** (plugin `0.80.x` for Flix 0.80), the same scheme `wstein/flix-spec` uses.

- There is one grammar, the newest, which is a permissive superset of the language. Older programs still parse; newer syntax needs a grammar update.
- The grammar dependency is pinned to an exact commit. Updating it is a normal PR, gated by `npm test` and the corpus check.
- A weekly workflow (`flix-upstream.yml`) runs the corpus check over the `flix-spec` fixtures with the newest grammar, and fails when the Flix release pinned by `flix-spec` no longer matches the plugin's `major.minor`. A red run means "Flix moved: update the grammar, re-run, and bump the version".
- Fixes for an older Flix minor go on a `0.<minor>` maintenance branch only when someone needs one.

## Limits

- The parser is the permissive Flix grammar: it accepts some programs the compiler later rejects. The plugin formats what parses; it does not validate.
- Parse errors are reported with line and column and nothing is printed.
- Very long method chains cannot wrap before a `.`, because a dot preceded by whitespace is a different token.
- No `// prettier-ignore` support yet.
