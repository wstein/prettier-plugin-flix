# Formatting behavior

[Return to the README](../README.md)

## What it formats

- Declarations: `mod`, `def`, `val`, `enum`, `struct`, `trait`, `instance`, `eff`, `type alias`, annotations and modifiers.
- Expressions: calls, method calls, operator chains (wrapped at the operator, with leading `::` for wrapped list constructors), lambdas, `if`/`else`, `match`/`choose`/`select`, `let` chains, `foreach`/`forM`/`forA`, `try`/`catch`, `run`/`with`, `region`, records, collections, Datalog constraint sets, string interpolation.
- Types and patterns, including effect annotations (`\ IO`), kinds, record, schema and case-set types.
- Comments (`//`, `///`, `/* */`) are kept next to the token they were written beside; blank lines between items are preserved (at most one).

Layout decisions that depend on the source are deliberate, so that formatting is stable: a block, record, or member list that spans several lines in the source stays multi-line; one written on a single line is collapsed or wrapped only by width.

## Whitespace-sensitive tokens

Flix classifies some tokens by the whitespace around them (`->` in `s->field` versus a lambda arrow, `.` in `a.b`, `::` in `use A::B`). The printer never moves those tokens across a boundary that changes their class: field access and method dots never break, and `use Pkg::Name` stays tight.

## Column alignment

Prettier indents multiline entries and uses a single space around `=>` and
`=`. In the examples below it also keeps the usual single space after a field
colon. Flix 0.80's built-in formatter pads some layouts to line up columns.

| Construct | Flix 0.80 | Prettier plugin |
| --- | --- | --- |
| Map entries | Aligns `=>` when keys and values fit on single lines | Wraps by width and keeps one space around `=>` |
| Record values | Aligns the `=` of multiline fields | Indents fields and keeps one space around `=` |
| Struct fields | Aligns the start of field types after `:` | Indents fields and uses one space after `:` |
| Match arms | Aligns `=>` in groups of single-line arms | Indents arms and keeps one space around `=>` |
| Handler rules | Aligns `=` in rule signatures | Indents rules and keeps one space around `=` |

Maps and records with short, uniform entries are good candidates for optional
column alignment. Padding long or nested entries can make code harder to scan
and cause changes on several lines when one field is renamed. For style choices,
use the Flix language documentation and handwritten examples. The
[built-in formatter implementation](https://github.com/flix/flix/blob/v0.80.0/main/src/ca/uwaterloo/flix/tools/fmt/PrettyPrinter.scala)
provides a comparison.

## Limits

- The parser is the permissive Flix grammar: it accepts some programs the compiler later rejects. The plugin formats what parses; it does not validate.
- Parse errors are reported with line and column and nothing is printed.
- Very long method chains cannot wrap before a `.`, because a dot preceded by whitespace is a different token.
- No `// prettier-ignore` support yet.
