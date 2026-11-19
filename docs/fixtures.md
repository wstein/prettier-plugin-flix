# Fixture guide

[Return to the README](../README.md)

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
- Every fixture is also checked with the [program-preservation checks](development.md#verification): the output must keep the program (tokens, comments, tree shape, token classes) and formatting it again must change nothing.
- `status: todo` records one known gap, so it takes exactly one Output block (split a case with several gaps, or with one option set already right, into separate fixtures). The Output block holds the *desired* result, the test passes while the formatter still differs, and fails as soon as it matches, so the status cannot go stale. Optional `issue` explains or links it.
- `status: error` has no Output block; the input must fail with a `SyntaxError`. Optional `message` is a regular expression for the error text.
- Optional front matter: `description`, `source` (where an input came from), `tags`, `flixFormat` and `flixFormatInvalid` (see below).

After changing the printer, `npm run test:update` rewrites the Output blocks of `status: pass` fixtures from the formatter's actual output. Review the diff: it is the review of the formatting change. The loader rejects unknown keys, options and sections, so typos fail loudly.

A fixture can also record the built-in Flix formatter as an independent reference. Set `flixFormat: "0.80.0"` in front matter (the same major.minor release as `flix`) and add a `## Flix Format` section with one block after `## Output`:

````markdown
---
title: ...
flix: "0.80"
flixFormat: "0.80.0"
flixFormatInvalid: true   # only if the Flix output fails to type-check
---
## Input
...
## Output
...
## Flix Format

```flix
...what `flix format` wrote...
```

## Flix Format Diagnostics

```text
Type Error [E6925]: ...
```
````

- A `flix` fence holds the output of `flix format`. A `text` fence means `flix format` declined the input (the CLI type-checks it first, so isolated examples that depend on a mounted package may end up here); it holds a *summary*, not the raw CLI output: one `<Kind> [Exxxx]: <message>` line per error, where the message is the `>>` line of the diagnostic or, for diagnostics that print a source excerpt instead, its first message line.
- `flixFormatInvalid: true` accepts a known case where the Flix output itself fails to type-check. It requires a `## Flix Format Diagnostics` section with exactly one `text` block (the same kind of summary for the output), and that section is allowed only then, so a changed or vanished error cannot go unnoticed.
- The existing `## Output` blocks and the program-preservation checks still define the Prettier expectations.

```sh
npm run test:flix-format -- path/to/flix.jar path/to/flix-spec/pin.json
npm run test:flix-format -- path/to/flix.jar path/to/flix-spec/pin.json --update
```

The comparison needs a Java 21 JDK and launches one JVM for all selected fixtures. It checks the pinned compiler version and JAR digest and uses isolated Flix instances to type-check both input and output. Every changed reference is printed with a diff (saved vs actual) and fails the command; `--update` rewrites the changed references instead. Two things are never rewritten and fail the command even with `--update`, until the fixture is reviewed: a validity change (Flix now rejects an input it used to format, or accepts one it declined, or the output became valid or invalid) and a crash of the Flix driver on a fixture (reported against that fixture; the others are still compared). The expected type errors of `flixFormatInvalid` fixtures are printed only when they changed or with `--verbose`. The JVM timeout is 60 seconds plus 15 seconds per fixture; set `FLIX_FORMAT_TIMEOUT_MS` to override it. The scheduled Flix corpora workflow runs this comparison after the other corpus checks. When changing the pin, update the fixtures' `flixFormat` versions and regenerate the references. Review the diff for changes in Flix output or diagnostics. The comparison logic is in `scripts/flix-format-lib.mjs` and is unit-tested without Java.

## Fixture documentation

The fixture catalog groups related Markdown fixtures on a chapter page. Each chapter has links to its cases, short descriptions, expected Prettier output, and available Flix formatter references. The Comments chapter groups related cases using the optional `group` field in the fixture front matter. A positive `showcase` order includes the same case on the Before and after page. Shiki highlights Flix at build time using the vendored [Flix 0.80 grammar from flix-textmate](https://github.com/wstein/flix-textmate/blob/23d12e36d33f1d20c0fa779188cc4a2121da8c4e/syntaxes/flix.tmLanguage.json).

Install Hugo 0.154.5 and run `npm ci` and `npm run docs:build` to generate the site in `docs/public/`. Build inputs come from the same Markdown files as the formatter tests. GitHub Actions builds the catalog on pull requests and deploys it to GitHub Pages from `main`.
