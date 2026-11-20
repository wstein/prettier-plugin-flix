# Flix formatting style

[Return to the README](../README.md)

This guide describes the layout produced by `prettier-plugin-flix`. The
examples below come from Markdown fixtures in the test suite.

## Line width and indentation

Use **four spaces per indentation level**. Four spaces make each nesting
level visible, and deeply nested blocks use more horizontal space. Changing
the indentation width shifts every nested line, so a shared indent keeps the
shape of the code consistent across files and projects.

`printWidth` sets the target line width and defaults to **100 columns**.
Adjusting it mainly affects constructs near the target width. That makes it
a way to fit code to the available editor space while keeping the indentation
style consistent. Long string literals and other indivisible tokens can
exceed the target.

The plugin supplies one layout per construct for a given width and source.
Operator placement, brace layout and alignment follow the same rules across
projects. This keeps formatting predictable and avoids a project-by-project
choice for each construct.

Prettier also accepts its standard configuration options. The Flix style in
this guide uses `tabWidth: 4`, `useTabs: false` and `endOfLine: "lf"`.
The Playground and embedded editors use four spaces per indentation level
and let you adjust the line width.
The examples below use an 80-column width unless a different width is shown.

## Calls and function signatures

Keep short calls and expressions compact. When an ordinary list of call
arguments needs to wrap, put one argument on each line. Keep commas after
their arguments and align the closing parenthesis with the start of the call.

**Before**

```flix
def f(): Int32 = g(aaaaaaaaaaaaaaaa, bbbbbbbbbbbbbbbbbbbb, cccccccccccccccccccc, dddddddddddddddddddd)
```

**After**

```flix
def f(): Int32 =
    g(
        aaaaaaaaaaaaaaaa,
        bbbbbbbbbbbbbbbbbbbb,
        cccccccccccccccccccc,
        dddddddddddddddddddd
    )
```

The line width also governs signatures. Prefer breaking at a boundary such
as the effect annotation or a `with` constraint when that keeps a short type
together. A short body can stay after the `=` on a continuation line. When
that combination is too wide, the body can start on its own indented line.

**Before**

```flix
def wait(rx: Receiver[Int32], n: Int32, tx: Sender[List[Int32]]): Unit \ { Chan, NonDet } =
    Channel.send(recvN(n, rx), tx)
```

**After**

```flix
def wait(rx: Receiver[Int32], n: Int32, tx: Sender[List[Int32]]): Unit
    \ { Chan, NonDet } = Channel.send(recvN(n, rx), tx)
```

[Call fixture](../test/fixtures/expressions/wrap-arguments.md) ·
[Signature fixture](../test/fixtures/declarations/signature-boundaries.md)

## Pipelines

A pipeline using `|>` or `!>` stays on one line when it fits. In a multiline
pipeline, the input expression comes first and each step starts on its own line
with its operator. Operators in the same chain align even when a step has
multiline arguments.

**Before**

```flix
def countSmallValues(values: List[Int32]): Int32 =
    values |> List.map(x -> x * 2) |> List.filter(x -> x < 4) |> List.length
```

**After at 45 columns**

```flix
def countSmallValues(
    values: List[Int32]
): Int32 =
    values
        |> List.map(x -> x * 2)
        |> List.filter(x -> x < 4)
        |> List.length
```

A wrapped cons chain similarly begins continuation lines with `::`. String
concatenation has its own rule. When it fits, `+ "\n" +` stays with the
preceding text so the separator is easy to associate with that line.

[Pipeline fixture](../test/fixtures/expressions/leading-pipeline-operators.md) ·
[Cons chain](../test/fixtures/expressions/long-cons-chain.md) ·
[String concatenation](../test/fixtures/expressions/concatenate-lines.md)

## Blocks and handlers

A block, record or member list written across multiple lines generally keeps
its multiline structure. An inline group can stay compact when it fits.
Sequential statements in a block get separate lines.

In a `run { … } with` chain, the first `with` follows the closing brace when
its clause fits. Later clauses start on their own lines beneath that first
`with`. If the first clause needs a new line, or the run expression has no
block to attach to, the clauses align with `run`.

**At 80 columns**

```flix
def main(): Unit \ { Logger, Sleep, IO } =
    run {
        println("Sleeping for 2 seconds (capped to 500ms)...");
        Sleep.sleep(seconds(2));
        println("Done!")
    } with Sleep.withMaxSleep(milliseconds(500))
      with Sleep.withLogging
```

**At 39 columns**

```flix
def main(): Unit
    \ { Logger, Sleep, IO } =
    run {
        println(
            "Sleeping for 2 seconds (capped to 500ms)..."
        );
        Sleep.sleep(seconds(2));
        println("Done!")
    }
    with Sleep.withMaxSleep(
        milliseconds(500)
    )
    with Sleep.withLogging
```

[Middleware fixture](../test/fixtures/expressions/sleep-middleware-chain.md) ·
[Handler chain at narrow width](../test/fixtures/declarations/run-with-chain.md)

## Alignment

Matching rows can share an operator column. Map arrows and record equals
signs align in eligible multiline literals with short, simple keys and values.
Flat `List#{…}` values can also qualify in maps. Map and record operator padding
is capped at eight extra spaces. Complex rows or rows that would exceed
`printWidth` use ordinary spacing.

Match arms can share an arrow column when their heads fit on single lines and
the padding fits the group. This includes groups with some multiline bodies.
The minimum space before an aligned `=>` or `=` is one.

**Before**

```flix
def next(xs: List[Int32]): Int32 = match xs {
case Nil => 0
case x :: _ => let result = x + 1; result
}
```

**After**

```flix
def next(xs: List[Int32]): Int32 = match xs {
    case Nil    => 0
    case x :: _ =>
        let result = x + 1;
        result
}
```

[Match fixture](../test/fixtures/expressions/mixed-match-bodies.md) ·
[Map alignment](../test/fixtures/expressions/align-map-entries.md) ·
[Record alignment](../test/fixtures/expressions/align-record-fields.md)

## Comments

Keep an ordinary trailing `//` comment at least two spaces from the code.
Consecutive commented lines at the same level share a column when each line
fits after alignment. A blank line, an uncommented line or a block boundary
ends the group.

**Before**

```flix
def firstElements(): List[Int32] = {
    let l = (1, 1) :: (2, 2) :: Nil;  // has type List[(Int32, Int32)]
    List.map(fst, l)                 // has type List[Int32], one per tuple
}
```

**After**

```flix
def firstElements(): List[Int32] = {
    let l = (1, 1) :: (2, 2) :: Nil;  // has type List[(Int32, Int32)]
    List.map(fst, l)                  // has type List[Int32], one per tuple
}
```

A comment after a function signature's `=` can share the column with the first
commented lines of its indented body. If the combined group would exceed the
width, the body comments can still align with each other. A standalone
`// ^` comment keeps pointing at the same token when the correspondence is
clear, including when the annotated line wraps.

[Tuple comments](../test/fixtures/comments/align-tuple-type-comments.md) ·
[Signature comments](../test/fixtures/comments/align-function-signature-comments.md) ·
[Caret markers](../test/fixtures/comments/caret-markers.md)

## Datalog

Keep a short query together. A longer query breaks before `select`, with
`from` on the same continuation line when it fits. At narrower widths,
the clauses get their own lines.

**Before**

```flix
def directPaths(): Vector[(String, String)] =
    query getParents() select (parentStation, childStation) from ParentOf(parentStation, childStation)
```

**After**

```flix
def directPaths(): Vector[(String, String)] =
    query getParents()
        select (parentStation, childStation)
        from ParentOf(parentStation, childStation)
```

For a long rule, keep `:-` at the end of the head and place the body on an
indented line. If the body needs more room, break it between predicates.
A multiline return schema can align its predicates beneath the first one
when the remaining signature fits.

[Query and schema fixture](../test/fixtures/datalog/query-clause-layout.md) ·
[Rule fixture](../test/fixtures/datalog/lattice-rule-layout.md)

## Sources and limits

The reference uses the official Flix documentation and handwritten examples
to guide style choices. The
[Flix 0.80 formatter implementation](https://github.com/flix/flix/blob/v0.80.0/main/src/ca/uwaterloo/flix/tools/fmt/PrettyPrinter.scala)
provides a comparison. The [documentation audit](official-examples.md) records
reviewed differences against the official examples.

- The plugin uses the Flix grammar to parse source. The Flix compiler remains
  the authority for type checking and other language checks.
- Syntax errors stop formatting and report a line and column.
- Flix assigns meaning to whitespace around certain tokens. Field access
  `s->field`, dots in `a.b` and package qualifiers in `use Pkg::Name` stay
  together. Very long method chains may exceed the configured width.
- The plugin currently has no `// prettier-ignore` support.
