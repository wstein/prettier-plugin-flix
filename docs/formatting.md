# Flix formatting style

[Return to the README](../README.md)

This guide describes the layout produced by `prettier-plugin-flix`. The
examples below come from Markdown fixtures in the test suite.

The plugin parses Flix **0.80.0** (default) and **0.79.0**. The published
fixture catalog keeps shared style-guide and chapter pages, and exposes each
pin under `/flix/<version>/` with a toolbar switcher. Editors in the 0.79
catalog default to that grammar. Fixtures that set `minVersion` / `maxVersion`
appear only in catalogs whose pin is in range (for example module-level `val`
is omitted under `/flix/0.79.0/`). Prefer those ranges or `flixVersion: 0.79.0`
when checking older syntax.

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

### Flix compiler version

`flixVersion` is an exact Flix compiler version whose grammar the parser uses.
The CLI flag is `--flix-version`. Omitting the option keeps the current
default. Supported values:

| `flixVersion` | Grammar |
| --- | --- |
| `0.80.0` (default) | Current `@wstein/flix-antlr-grammar` pin (`flix-0.80.0`) |
| `0.79.0` | Vendored `@wstein/flix-antlr-grammar` commit before reserved `val` (`flix-0.79.0`) |

Flix 0.80.0 adds reserved `KeywordVal` and module-level `Decl.Val`, so
`val n: Int32 = 1` parses under `0.80.0` and is rejected under `0.79.0`, while
`def val(): Int32 = 42` is rejected under `0.80.0` because `val` is reserved.
Unsupported values error. Keep one `flix` parser and `.flix` language entry for
every pin; the shared `flix-ast` printer uses each parse tree's grammar token
constants. The Playground and embedded editors offer the same choices; a
non-default version travels with **Open in Playground** handoff.

## Supported print widths

The plugin guarantees idempotence for `printWidth` of 40 or more: a second
formatting run changes nothing. Known exceptions are listed in
`test/known-idempotence-failures.json`; a failure listed there stays known
until it is fixed. Below `printWidth` 40, idempotence is best effort and not
supported: failures there are known and do not block a pull request.
The review sweeps run at widths 40 to 160 by default; `--widths` replaces the
default widths, so pass it to check narrower ones. Failures below 40 are tracked
as lines under "Outside the guarantee (printWidth below 40)" in the epics.

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
A break before a braced effect set must still leave room for `=` and a hugged
body on that continuation; otherwise the set stays with the return type. A
block comment between the set and `=` counts toward that same trailer width.
When `=` follows an own-line comment, only the gap before that comment is reserved.

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
[Signature fixture](../test/fixtures/declarations/signature-boundaries.md) ·
[Effect set with region body](../test/fixtures/declarations/signature-effect-set-with-region.md) ·
[Effect set with comment before `=`](../test/fixtures/declarations/signature-effect-set-equals-block-comment.md) ·
[Effect set with own-line comment before `=`](../test/fixtures/declarations/signature-effect-set-own-line-before-equals.md) ·
[Effect set with call body](../test/fixtures/declarations/signature-effect-set-call-body.md) ·
[Effect set with `match` and own-line comment](../test/fixtures/declarations/signature-effect-set-match-own-line.md) ·
[Schema with comment before `=`](../test/fixtures/declarations/schema-equals-block-comment.md)

Keep short function types on one line. When an arrow chain wraps, leave each
`->` after its parameter type, align the continued parameter types, and indent
the final result. A return type chain of two or more arrows (the `->` of the
result type; one arrow, and an arrow in parentheses, is not a chain) that does
not fit after the parameters moves as a whole to its own continuation line
when it fits there. The remaining `with` list and effect set follow on the
next line in the same column when they fit on one line there; otherwise they
continue on the chain line. The chain stays after the parameters when it and
the next word fit there. A chain that does not fit on its own line, or that
leaves no room for the next word on its line, wraps at each arrow. A single
arrow wraps as before. A type that starts on the line of its
signature or of its `=` continues one level deeper than that line. A line
comment after an arrow stays at the end of that line. Parenthesized
function types wrap independently. The
[F# formatting guide](https://learn.microsoft.com/en-us/dotnet/fsharp/style-guide/formatting#formatting-types-in-signatures)
uses the same layout for curried function types.
[Function type fixture](../test/fixtures/declarations/long-function-types.md) ·
[Arrow chain on one line fixture](../test/fixtures/declarations/signature-arrow-chain-one-line.md) ·
[Single arrow fixture](../test/fixtures/declarations/signature-arrow-single.md) ·
[Chain with effect set fixture](../test/fixtures/declarations/signature-arrow-chain-effect-wrap.md)

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

### Trait constraints

Keep a short `with` list inline when it fits. When the list wraps, put
each constraint on its own indented line. A constraint's type arguments can
still wrap if that constraint alone needs more room. A line comment after a
comma stays with the preceding constraint.

Like `where` clauses in the Rust guide, a wrapped list puts each constraint
on its own line. The list has no trailing comma, and `=` or `{` follows the
last constraint. The constraints are indented one level from the declaration,
which is also the column of a function body that starts below `=`. This holds
when the return type wraps and the last part of that type ends in `with`.

When the signature needs a break but the entire constraint list still fits,
`with` and the list can move together to a continuation line. A short body can
follow `=` on that line. A body that moves to the next line starts in the same
column as the continuation, as in
[Flix's Boxable example](https://github.com/flix/flix/blob/v0.80.0/main/src/library/Fixpoint3/Boxable.flix#L168-L170).

At width 60, the trait constraint fixture shows the list and body sharing a
column:

```flix
pub def render[a: Type, b: Type, c: Type, d: Type] (
    first: a,
    second: b,
    third: c,
    fourth: d
): String with
    ToString[a],
    ToString[b],
    ToString[c],
    ToString[d] =
    ToString.toString(first)
        + ToString.toString(second)
        + ToString.toString(third)
        + ToString.toString(fourth)
```

[Signature boundaries fixture](../test/fixtures/declarations/signature-boundaries.md) ·
[Rust Style Guide](https://doc.rust-lang.org/style-guide/items.html#where-clauses) ·
[Trait constraint fixture](../test/fixtures/declarations/trait-constraint-lists.md) ·
[Arrow return with list fixture](../test/fixtures/declarations/arrow-return-with-list.md)

## Binary operators

Binary operators that wrap—`+`, `-`, `*`, `/`, `and`, `or`, `==`, `:::`, and
other infix forms—break **before** the operator so the continuation starts
with the operator (leading), not after it (trailing):

```flix
ToString.toString(first)
    + ToString.toString(second)
    + ToString.toString(third)

veryLongNameAAAAAAAA
    and veryLongNameBBBBBBBB
    and veryLongNameCCCCCCCC
```

This matches `flix format` (`PrettyPrinter.prettyBinary`:
`line <> opDoc <> …`) and live reformatting of trailing chains into leading
ones. Pipelines `|>` / `!>` and wrapped list cons chains also start their
continuations with the operator.

When a line comment trails the operator, or an own-line comment sits between
the operator and the next operand, that link keeps a **trailing** break
(`op` then newline) so the comment stays attached and a second format pass is
idempotent. Further links without such a comment still lead.
[Comment after operator](../test/fixtures/comments/binary-operator-comment-after.md) ·
[Adjacent line comments](../test/fixtures/comments/adjacent-line-comments.md)

String concatenation keeps a related special case: when it fits, `+ "\n"` stays
with the preceding text so the newline separator is easy to associate with that
line; further `+` links still lead on later lines.
[String concatenation](../test/fixtures/expressions/concatenate-lines.md) ·
[Operator chain](../test/fixtures/expressions/operator-chain.md) ·
[Leading `and` / `or`](../test/fixtures/expressions/leading-binary-and-or.md) ·
[Leading `*` `/` `<+>`](../test/fixtures/expressions/leading-binary-mult-angled.md) ·
[Mixed-operator guard](../test/fixtures/expressions/guarded-match-mixed-operators.md) ·
[flix format PrettyPrinter](https://github.com/flix/flix/blob/v0.80.0/main/src/ca/uwaterloo/flix/tools/fmt/PrettyPrinter.scala)

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

Use spaces around list cons in expressions and patterns. For example,
`1::2::Nil` becomes `1 :: 2 :: Nil` and `case x::xs => x` becomes
`case x :: xs => x`. A wrapped chain starts each continuation with `::`.
Keep a cons operator tight when a comment is glued to it, such as
`x::// note`. Package qualifiers such as `use pkg::Mod` stay tight, and list
append `:::` stays spaced.
[Cons normalization](../test/fixtures/expressions/list-cons-normalization.md) ·
[Cons spacing](../test/fixtures/expressions/cons-chain-spacing.md) ·
[Tight comments](../test/fixtures/whitespace/package-qualifier-tight-comments.md)

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
their declaration. A Flixdoc block (exactly `///`, not `////`) sits directly
above that declaration (or its leading annotations) with no blank line in
between when the last leading comment is Flixdoc. A plain `//` or `////`
header may keep a blank line before the code.
[Declaration spacing fixture](../test/fixtures/declarations/block-spacing.md) ·
[Flixdoc attachment](../test/fixtures/comments/attach-flixdoc.md)

Keep one source blank line directly after the `{` of a `mod`, `trait`,
`instance`, `eff`, or `struct`, including before a comment or Flixdoc.
Several blank lines become one. Following `flix format` 0.80.0, remove the
opening blank line in enums, including enum bodies that contain only comments.
If an end-of-line comment after an enum's opening brace is followed by a blank
line and more body content, indent the comment inside the enum and keep the gap
after it. The plugin removes a blank line before the closing `}`. Flix 0.80.0
keeps that gap in declarations that preserve opening blank lines.
[Blank line after the brace fixture](../test/fixtures/declarations/mod-blank-line-after-brace.md) ·
[Comment-only declarations](../test/fixtures/declarations/comment-only-declaration-braces.md) ·
[Enum opener comments](../test/fixtures/declarations/enum-opener-comment-gap.md)

```flix
mod Shapes {

    def area(): Int32 = 1
}
```

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
column. A blank line starts a new group. An ordinary line comment directly
above a match arm, record field, map entry, or handler clause stays with that
row and shares its alignment group. An existing blank line on either side of
the comment separates groups, and consecutive blank lines reduce to one.
An own-line block comment still separates groups. When a separator's comment
moves onto its own line, apply the same grouping rule to where it prints.
Leading comments stay outside the measured head. The formatter places the
separator one space after the longest single-line head.

[Alignment across row comments](../test/fixtures/expressions/align-commented-rows.md)

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
[Literal types in tuple rows](../test/fixtures/expressions/align-tuple-literals.md) ·
[Map block comments](../test/fixtures/expressions/align-map-block-comment.md) ·
[Match leading block comment](../test/fixtures/expressions/match-leading-block-comment.md) ·
[Align after line comment with block lead](../test/fixtures/expressions/align-after-line-comment-block-lead.md) ·
[List block comment before separator](../test/fixtures/comments/call-eol-block-before-comma.md)

Match arms and handler clauses can share a separator column even when a
body spans multiple lines. Alignment is skipped when padding would wrap a
compact arm body that fits without alignment.
[Short match body](../test/fixtures/expressions/align-match-short-body.md) ·
[Wrapped match arms](../test/fixtures/expressions/align-match-wrapped-arms.md).
Handler clauses use the configured width to decide whether the aligned
lines fit, including any trailing comment.
OCamlFormat's `break-cases` option offers a comparison between margin-driven
wrapping and vertical branches.
Flix can keep a short arm body after `=>` and indent a longer body beneath it.
Keep a guarded pattern and its `=>` together when they fit, as in Rust's
match style. A guard that does not fit wraps at an operator, including
mixed `+` / `==` chains, and continues one level deeper than the arm body,
so the continuation stays apart from the statement under `=>`. Rust instead
breaks before `if` and uses a block body.
[Rust Style Guide](https://doc.rust-lang.org/style-guide/expressions.html#match)
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
[Guarded match fixture](../test/fixtures/expressions/guarded-match-wrap-boundary.md) ·
[Mixed-operator guard](../test/fixtures/expressions/guarded-match-mixed-operators.md) ·
[Handler clauses and group boundaries](../test/fixtures/expressions/align-handler-clauses.md) ·
[Map alignment](../test/fixtures/expressions/align-map-entries.md) ·
[Record alignment](../test/fixtures/expressions/align-record-fields.md)

Record braces have no inner padding: `{x = T}`, `{x = 1 | r}` and
`{x = n | _}`. Effect sets and schema braces keep a space
(`\ { Chan }`, `#{ A(Int32) }`). An open record that starts with `|` keeps
a leading space only (`{ | a}`). A single bare name in braces is parsed as a
record field but printed with padding like a block (`{ x }`), as Flix does.
A comment-only collection brace (`List#{}`, `Array#{}`, `Set#{}`, `Map#{}`,
`Vector#{}`), record, schema `#{…}`, or `(…)` (parameter lists, calls, unit,
and tuple patterns) breaks once after the opener and drops any blank line
there. Declaration braces for `mod` / `trait` / `instance` / `eff` / `struct`
preserve one source blank (`enum` bodies still drop it). This follows
`flix format` 0.80.0 where it retains the comment. The plugin also preserves
comments in empty call argument lists.
[Record brace padding fixture](../test/fixtures/expressions/record-no-inner-pad.md) ·
[Comment-only collection braces](../test/fixtures/expressions/brace-only-comment.md)

Record updates, open record types, record patterns, and record-row aliases
keep their `| …` tail with the last field when they fit on one line. Start
the tail on a new line at the field indentation when the line would exceed
the width or a line comment ends the last field. When a comment is attached
to the pipe, the tail stays on the line of the last field, even beyond the
width.
[Record update fixture](../test/fixtures/expressions/record-update-tail.md) ·
[Record type and pattern fixture](../test/fixtures/expressions/record-type-pattern-tails.md) ·
[Row type fixture](../test/fixtures/declarations/row-type-tails.md)

## Comments

A standalone comment above an operator chain stays on its own line. The
chain can still fit on one line underneath it.
[Leading operator comments](../test/fixtures/comments/leading-operator-comments.md)

Keep an ordinary trailing line comment at least two spaces from the code.
Four or more slashes (`////`, `/////`, …) are ordinary line comments and join
the same gap and alignment. Trailing Flixdoc (`///` exactly) keeps a single
space and stays out of the alignment group. Consecutive commented lines at the
same level share a column when each line fits after alignment. A blank line, an
uncommented line or a block boundary ends the group.
[Trailing slash comment kinds](../test/fixtures/comments/trailing-slash-comment-kinds.md)

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
when the remaining signature fits. In schema types and schema-row aliases,
keep the final predicate and its `| …` tail together when they fit. Start
the tail on a new line at the predicate indentation when the line would
exceed the width or a line comment ends the final predicate. When a comment
is attached to the pipe, the tail stays on the line of the last predicate,
even beyond the width.
[Row type fixture](../test/fixtures/declarations/row-type-tails.md)

When the source places every predicate of a multi-predicate body on its own
line after the head, preserve that layout at wider widths.
[Vertical rule fixture](../test/fixtures/datalog/vertical-rule-body.md)

[Query and schema fixture](../test/fixtures/datalog/query-clause-layout.md) ·
[Rule fixture](../test/fixtures/datalog/lattice-rule-layout.md)

## Relation to flix format

The plugin formats in the Prettier style: it chooses line breaks from the
print width. It does not replace `flix format`. The Flix 0.80.0 formatter has
no line width: it derives no layout from a width constraint, uses a fixed
indent of four spaces and rewrites files in place
([document model](https://github.com/flix/flix/blob/v0.80.0/main/src/ca/uwaterloo/flix/tools/fmt/Doc.scala),
[indentation](https://github.com/flix/flix/blob/v0.80.0/main/src/ca/uwaterloo/flix/tools/fmt/PrettyPrinter.scala#L19),
[file writes](https://github.com/flix/flix/blob/v0.80.0/main/src/ca/uwaterloo/flix/api/lsp/FormatterLsp.scala#L31-L72)).
In Flix v0.80.0, `./mill flix.testFormatter` runs locally. The Flix CI
workflows at that tag omit the formatter correctness test
([build.mill](https://github.com/flix/flix/blob/v0.80.0/build.mill),
[TestFormatterCorrectness.scala](https://github.com/flix/flix/blob/v0.80.0/main/test/ca/uwaterloo/flix/tools/fmt/TestFormatterCorrectness.scala)).

The v0.80.0 standard library was reformatted with the Flix formatter in
May 2026 (flix/flix#12755). A pass of the Flix formatter changes 12 of its
243 files. The other 231 are already fixed points. All 12 changed files have
later commits after the reformat. The plugin output changes 236 of the 243
files at print widths 80 and 100 (238 at 160). Measured on `74de28a` of `main` on 2026-11-22, the
token sequence of every file is unchanged at widths 80, 100 and 160; only the
whitespace between tokens differs. Of 408110 gaps between tokens, 19311 differ
at width 80, 12944 at 100 and 8827 at 160. The main kinds at widths 80 and 160:

| Difference | Gaps at 80 | Gaps at 160 |
| --- | --- | --- |
| The plugin breaks a line, Flix does not | 13822 | 1997 |
| Flix breaks a line, the plugin does not (often after `=`) | 1363 | 3430 |
| Spaces inside a line (padding before `=` and `=>`, space before a trailing comment) | 2485 | 1972 |
| Indentation of a line that both break | 921 | 708 |
| Blank line after `{` or before `}`, which Flix keeps and the plugin removes | 476 | 476 |

This section describes the output. It does not change a rule and promises no
match with `flix format`. The idempotence guarantee for `printWidth` of 40 or
more (see [Supported print widths](#supported-print-widths)) is unchanged.

For construct-by-construct differences—and when Scala, Haskell, or the Flix
book justify a conscious plugin choice—see
[Built-in Flix format vs Prettier plugin](format-references.md).

The row about blank lines after `{` predates the current rule for
`mod`, `trait`, `instance`, `eff`, `struct`, and enum bodies.

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
  original text where it cannot determine a complete unit. An unclosed
  `(` that later pairs with a closer on a following Datalog rule, such as
  `Broken(1,` before `Q(3,4).`, keeps that next rule in the same recovery
  slice. That rule stays unformatted; the other complete rules still format.
- Flix assigns meaning to whitespace around certain tokens. Field access
  `s->field`, dots in `a.b` and package qualifiers in `use Pkg::Name` stay
  together. Flix 0.80.0 requires method and qualifier dots to touch the
  characters on both sides. A line comment that immediately follows a dot
  stays attached, with the name on the next line. A long method chain can
  wrap inside an argument list. A chain of argument-free calls may exceed
  the configured width. The formatter normalizes list cons to the spaced
  form and preserves the class of package qualifiers and other sensitive
  tokens. A cons operator with a glued comment stays tight.
  [Method chain fixture](../test/fixtures/expressions/long-method-chain.md) ·
  [Comments beside dots](../test/fixtures/whitespace/tight-dot-comments.md) ·
  [Cons spacing](../test/fixtures/expressions/cons-chain-spacing.md) ·
  [Tight cons comments](../test/fixtures/whitespace/package-qualifier-tight-comments.md)
- Put `// prettier-ignore` on its own line before a declaration to preserve
  that declaration's source text. The rest of the file is formatted normally.
  The declaration still needs to parse. [Fixture](../test/fixtures/comments/prettier-ignore.md)
