# Flix formatting style

[Return to the README](../README.md)

This guide describes the layout produced by `prettier-plugin-flix`. The
examples below come from Markdown fixtures in the test suite.

## Line width and indentation

Use **four spaces per indentation level**. Four spaces make each nesting
level visible, and deeply nested blocks use more horizontal space. The
[Scala indentation guide](https://docs.scala-lang.org/style/indentation.html)
uses two spaces per level. Changing the indentation width shifts every nested
line, so a shared indent keeps the shape of the code consistent across files
and projects.

`printWidth` sets the target line width and defaults to **100 columns**.
Adjusting it mainly affects constructs near the target width. That makes it
a way to fit code to the available editor space while keeping the indentation
style consistent. Long string literals and other indivisible tokens can
exceed the target.

Rust uses the same indentation and width defaults.
[Rust Style Guide](https://doc.rust-lang.org/style-guide/#indentation-and-line-width)

The plugin supplies one layout per construct for a given width and source.
Operator placement, brace layout and alignment follow the same rules across
projects. This keeps formatting predictable and avoids a project-by-project
choice for each construct.
Go's formatter also gives projects a shared layout. Go leaves the decision
about when a line is too long to the author. Flix uses the target width to
wrap calls and signatures consistently. [Effective Go](https://go.dev/doc/effective_go#formatting)

Prettier also accepts its standard configuration options. The Flix style in
this guide uses `tabWidth: 4`, `useTabs: false` and `endOfLine: "lf"`.
The Playground and embedded editors use four spaces per indentation level
and let you adjust the line width.
The standalone Playground opens at 100 columns. Embedded editors default to
60 columns to fit their narrower panels. The examples below use an
80-column width unless a different width is shown.

## Calls and function signatures

Keep short calls and expressions compact. When an ordinary list of call
arguments needs to wrap, put one argument on each line. Keep commas after
their arguments and align the closing parenthesis with the start of the call.
Fixed indentation keeps the argument columns stable if the callee is renamed.
The [Scala guide to long argument lists](https://docs.scala-lang.org/style/indentation.html#methods-with-numerous-arguments)
uses the same principle.

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

A block-bodied lambda can start on the call line when it is the final
argument and the call prefix fits. Indent the statements inside the lambda.
When the prefix needs to wrap, the call can put the lambda on its own
argument line and close the call on a separate line.

**Before**

```flix
def f(): Unit = List.forEach(xs, x -> {
println(x);
println(x)
})
```

**After**

```flix
def f(): Unit = List.forEach(xs, x -> {
    println(x);
    println(x)
})
```

[Trailing lambda fixture](../test/fixtures/expressions/hug-trailing-lambda.md) ·
[Width fallback fixture](../test/fixtures/expressions/trailing-lambda-width.md)

## Pipelines

A pipeline using `|>` or `!>` stays on one line when it fits. In a multiline
pipeline, the input expression comes first and each step starts on its own line
with its operator. Operators in the same chain align even when a step has
multiline arguments.

F# also starts each wrapped step with `|>`. Flix indents the steps one level
beneath the input to show that they continue the same expression.
[F# formatting guidelines](https://learn.microsoft.com/en-us/dotnet/fsharp/style-guide/formatting#formatting-pipeline-expressions)

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
The Haskell formatter Ormolu similarly uses source layout as a signal for
choosing between compact and multiline forms. [Ormolu](https://github.com/tweag/ormolu#readme)

Between sibling declarations, use the spacing from the source. Adjacent
declarations stay together, and an existing gap becomes one blank line,
including next to braced bodies. Annotations and leading comments stay with
their declaration. [Declaration spacing fixture](../test/fixtures/declarations/block-spacing.md)

In a `run { … } with` chain, keep the first `with` beside the closing brace,
like `} else`. A long handler call wraps its arguments within the clause.
If its single argument is itself a call, the closing parentheses can share
a line. Later clauses start beneath the first `with`. A `run` expression without
a block and with a single short handler can stay on one line. When it wraps, or
it has multiple handlers, start the `with` clauses on separate lines aligned
with `run`. A line comment after a closing brace also moves the clauses to
separate lines aligned with `run`.

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
    } with Sleep.withMaxSleep(
        milliseconds(500))
      with Sleep.withLogging
```

[Middleware fixture](../test/fixtures/expressions/sleep-middleware-chain.md) ·
[Handler chain at narrow width](../test/fixtures/declarations/run-with-chain.md)

## Comprehensions and parallel bindings

A short `for … yield` or `forM … yield` can stay compact. When the generator
list wraps, put one generator on each line and keep a short `yield` expression
beside the closing parenthesis.

**At 80 columns**

```flix
def f(): Option[Int32] =
    forM (
        x <- divide(5, 2);
        y <- divide(x, 8);
        z <- divide(9, y)
    ) yield x + y + z
```

Keep a short `par … yield` together when it fits. When it wraps, put each binding
on its own line and keep the short `yield` expression with the closing
parenthesis. Keep `par (` on the binding line when there is room for it.

[Comprehension fixture](../test/fixtures/expressions/for-yield-generators.md) ·
[Parallel scoreboard fixture](../test/fixtures/expressions/scoreboard.md)

## Alignment

Consecutive items of the same kind in one block can share a separator
column. A blank line or standalone comment starts a new group. The formatter
places the separator one space after the longest single-line head.

Map arrows and record equals signs align in eligible multiline literals
with short, simple keys and values.
Flat `List#{…}` values can also qualify in maps. Short sums or differences
of simple values can qualify in records. Map and record operator padding
is capped at eight extra spaces. Complex rows or rows that would exceed
`printWidth` use ordinary spacing.
Scalafmt's alignment settings illustrate the same trade-off between aligned
columns and the line width. [Scalafmt configuration](https://scalameta.org/scalafmt/docs/configuration.html#alignallowoverflow)

When a vector, list, array, or set prints matching rows of literal tuples
on separate lines, align columns of integers, floating-point and decimal
literals, strings, characters, booleans, regexes and `null`. Each column must
use the same literal kind in every row. Integers align on the right.
Floating-point and decimal literals align at the decimal point. If a literal
has no point, align at the end of its mantissa. Other literals, including
strings with single-line interpolations, align on the left. A nested tuple or
collection can also occupy a column when it fits on one line. Align the start
of the nested value and use ordinary formatting inside it.
Padding must fit the available width. If a trailing comment already extends
past the target, align the values when the code before that comment still fits.
Compact collections stay inline.

[Tuple-row fixture](../test/fixtures/expressions/align-tuple-rows.md) ·
[Literal types in tuple rows](../test/fixtures/expressions/align-tuple-literals.md)

Match arms and handler clauses can share a separator column even when a
body spans multiple lines. Handler clauses use the configured width to
decide whether the aligned lines fit, including any trailing comment.
OCamlFormat's `break-cases` option offers a comparison between margin-driven
wrapping and vertical branches.
Flix can keep a short arm body after `=>` and indent a longer body beneath it.
[OCamlFormat options](https://github.com/ocaml-ppx/ocamlformat/blob/main/doc/manpage_ocamlformat.mld)

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
[Handler clauses and group boundaries](../test/fixtures/expressions/align-handler-clauses.md) ·
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

After a trailing `//` comment on a comma, consecutive comment-only lines that
are indented farther than the surrounding items in the source align with that
`//`. A comment at item indentation or after a blank line starts a separate
group.

**Before**

```flix
def a(): Unit = g(
    1,  // after the comma this is a pretty long comment saying
       // needing a second line...
          // and a third line
    // comment on the lambda
    x -> { println(x) }
)
```

**After**

```flix
def a(): Unit = g(
    1,  // after the comma this is a pretty long comment saying
        // needing a second line...
        // and a third line
    // comment on the lambda
    x -> { println(x) }
)
```

[Tuple comments](../test/fixtures/comments/align-tuple-type-comments.md) ·
[Signature comments](../test/fixtures/comments/align-function-signature-comments.md) ·
[Comment continuations](../test/fixtures/comments/indented-comment-continuations.md) ·
[Caret markers](../test/fixtures/comments/caret-markers.md)

## Datalog

Keep a short query together. A longer query breaks before `select`, with
`from` on the same continuation line when it fits. At narrower widths,
the clauses get their own lines.

Keep the sources after `query` and the predicates after `from` together
when their list fits. Otherwise, start the list below its keyword and put
one item on each line. A predicate's arguments can wrap within its own entry
when that entry still exceeds the available width.
[Query list fixture](../test/fixtures/datalog/query-list-wrap.md)

Apply the same layout to source lists after `solve`, `psolve` and `inject`.
A short expression stays together. A long `solve … project` or `inject … into`
can break before its second keyword. When a source, projection or destination
list needs more room, it starts below its keyword and uses one item per line.
[Solve and inject fixture](../test/fixtures/datalog/fixpoint-list-wrap.md)

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
The Datalog 2.3 manual shows the same split between a rule's head and its
indented body. [Datalog User Manual](https://datalog.sourceforge.net/datalog.html#index-clause-24)
A multiline return schema can align its predicates beneath the first one
when the remaining signature fits.

When the source places every predicate of a multi-predicate body on its own
line after the head, preserve that layout at wider widths.
[Vertical rule fixture](../test/fixtures/datalog/vertical-rule-body.md)

[Query and schema fixture](../test/fixtures/datalog/query-clause-layout.md) ·
[Rule fixture](../test/fixtures/datalog/lattice-rule-layout.md)

## Sources and limits

The [Flix website](https://flix.dev/) and [Flix language book](https://doc.flix.dev/)
provide examples that guide the plugin's style choices. The
[Flix 0.80 formatter implementation](https://github.com/flix/flix/blob/v0.80.0/main/src/ca/uwaterloo/flix/tools/fmt/PrettyPrinter.scala)
provides a comparison. The [documentation audit](official-examples.md) records
reviewed differences against the official examples.

- The plugin uses the Flix grammar to parse source. The Flix compiler remains
  the authority for type checking and other language checks.
- The CLI reports a syntax error with its line and column. The Playground
  can also format independently parseable declarations, Datalog rules and
  constructor or field entries around an error. The preview preserves the
  original text where it cannot determine a complete unit.
- Flix assigns meaning to whitespace around certain tokens. Field access
  `s->field`, dots in `a.b` and package qualifiers in `use Pkg::Name` stay
  together. Flix 0.80.0 requires method and qualifier dots to touch the
  characters on both sides. A line comment that immediately follows a dot
  stays attached, with the name on the next line. A long method chain can
  wrap inside an argument list. A chain of argument-free calls may exceed
  the configured width.
  [Method chain fixture](../test/fixtures/expressions/long-method-chain.md) ·
  [Comments beside dots](../test/fixtures/whitespace/tight-dot-comments.md)
- Put `// prettier-ignore` on its own line before a declaration to preserve
  that declaration's source text. The rest of the file is formatted normally.
  The declaration still needs to parse. [Fixture](../test/fixtures/comments/prettier-ignore.md)
