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
