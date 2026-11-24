# Built-in Flix format vs Prettier plugin

[Return to the formatting style](formatting.md)

This page is about **conscious differences** between **`flix format` (Flix 0.80.0)**
and **`prettier-plugin-flix`**. The through-line is always:

> Built-in output → plugin output → **why the plugin’s choice is justified** by an
> established formatter elsewhere.

**Scala ([scalafmt](https://scalameta.org/scalafmt/))** is the primary external
reference: Flix’s surface syntax and many declaration forms follow Scala. For
**purely functional** forms with no good OOP analogue (list cons, pipelines as
composition, wide type arrows, comprehensions), **Haskell
([Ormolu](https://github.com/tweag/ormolu) / [Fourmolu](https://github.com/fourmolu/fourmolu))**
is the reference.

A row is only a “plugin keeps X” decision when that external reference supports
X. Where the built-in formatter has an open **correctness** bug, the plugin
preserves valid code; the external reference shows the same refusal to destroy
tokens or comments.

Upstream issues are called out as **known built-in problems**, not as style
targets for the plugin to copy.

See also [Relation to flix format](formatting.md#relation-to-flix-format) for
stdlib gap measurements. The plugin does not promise to match `flix format`.

## Upstream formatter issues (filed against Flix)

| Issue | Status | Summary | Section |
| --- | --- | --- | --- |
| [flix/flix#13758](https://github.com/flix/flix/issues/13758) | Open | Line comment merges with the next token | [Comments on `=` / openers](#comments-on--and-openers) |
| [flix/flix#13759](https://github.com/flix/flix/issues/13759) | Open | `d"..."` → `d "..."` (**case H**) | [Debug interpolator](#debug-interpolator) |
| [flix/flix#13760](https://github.com/flix/flix/issues/13760) | Open | Space in `use pkg ::Mod` | [Package `::` and cons `::`](#package--and-cons-) |
| [flix/flix#13761](https://github.com/flix/flix/issues/13761) | Open | Drops `if /* c */ (` | [Comments around `if` / `match`](#comments-around-if--match) |
| [flix/flix#13762](https://github.com/flix/flix/issues/13762) | Open | Inline `/* */` breaks indent / idempotence | [Inline block comments](#inline-block-comments) |
| [flix/flix#13763](https://github.com/flix/flix/issues/13763) | Open | Space before `[` in `def f [a]` | [Type parameters and `with`](#type-parameters-and-with) |
| [flix/flix#13767](https://github.com/flix/flix/issues/13767) | Open | Stray `\r` in comments after CRLF→LF | [Line endings inside comments](#line-endings-inside-comments) |
| [flix/flix#13676](https://github.com/flix/flix/issues/13676) | **Closed** | Comment ate the next record field | [Record fields and `\|` tails](#record-fields-and--tails) |

---

## Comments on `=` and openers

**Built-in:** Often moves a comment after `=` / `{` / `=>` / `with` onto the next
line, or joins a line comment with the following token so the program stops
compiling ([#13758](https://github.com/flix/flix/issues/13758)).

**Plugin:** Keeps the comment with the syntactic owner
(`= // note`, hugged `=> /* c */`).

**Justification (Scala):** scalafmt leaves end-of-line comments on the same line
as `=`, `{`, or `=>` when they fit. It never concatenates the next line’s code
into the comment. Copying Flix’s merge behavior would drop the next token.

```flix
// Plugin (matches Scala-style EOL ownership)
def g(x: Int32): Int32 =  // after the equals
    x + 1

// Built-in second pass (comment demoted — or worse under #13758)
def g(x: Int32): Int32 =
    // after the equals
    x + 1
```

**Open point:** [#13758](https://github.com/flix/flix/issues/13758) — do not
“align” the plugin toward joining comments with tokens.

Fixtures: `comments/comment-after-equals.md`, `comments/declaration-head-comment.md`.

---

## Comments around `if` / `match`

**Built-in:** Can delete `if /* c */ (` ([#13761](https://github.com/flix/flix/issues/13761))
or reshuffle `else` / arm comments.

**Plugin:** Preserves comments after the condition, before `else`, and on arms.

**Justification (Scala):** A comment between `if` and `(` is kept; scalafmt does
not strip it. Match/`case` comments stay with their arm. Losing comments is not
an accepted Scala formatter tradeoff.

```flix
// Plugin / valid source
def f(): Int32 = if /* c */ (true) { 1 } else { 2 }

// Built-in (#13761) may drop /* c */
```

**Open point:** [#13761](https://github.com/flix/flix/issues/13761).

Fixtures: `comments/if-comment-boundaries.md`, `expressions/hug-match-lambda-*.md`.

---

## Inline block comments

**Built-in:** May move the next token to column 0; a second run changes the file
again ([#13762](https://github.com/flix/flix/issues/13762)).

**Plugin:** Keeps `/* */` in the token stream and wraps at width without
resetting indent to column 0.

**Justification (Scala):** Inline `/* */` remains in flow; scalafmt does not
left-align the following token to column 0 as a side effect, and a second run
is stable. Non-idempotent indent jumps are formatter bugs, not a style to mirror.

**Open point:** [#13762](https://github.com/flix/flix/issues/13762).

Fixtures: `comments/inline-block-comment.md`, `comments/trailing-block-comment*.md`.

---

## Trailing-comment alignment

**Built-in:** No column alignment of neighboring `//` comments (and may move
them).

**Plugin:** Aligns neighboring end-of-line comments to a shared column when the
fixture / rule asks for it.

**Justification (Scala):** scalafmt’s `align` settings (including trailing
comments / tokens) exist specifically so EOL comments can share a column. The
plugin’s alignment is the same product idea under Prettier’s width model—not an
invention relative to Scala tooling.

```flix
// Plugin (Scala-like align)
def f(): Int32 \ IO =    // f is impure
    let r1 = inc1(123);  // pure

// Built-in (single space / possible move)
def f(): Int32 \ IO =
    // f is impure
    let r1 = inc1(123); // pure
```

Fixtures: `comments/align-function-signature-comments.md`, `expressions/align-*`.

---

## `prettier-ignore`

**Built-in:** No ignore marker — reformats the region.

**Plugin:** Honors `// prettier-ignore`.

**Justification (Scala):** scalafmt’s `// format: off` / `on` is the established
escape hatch. A formatter that cannot leave an authored region alone is the
outlier; the plugin follows the Scala (and Prettier) convention.

Haskell: Fourmolu/Ormolu disable pragmas play the same role for FP codebases.

Fixtures: `comments/prettier-ignore.md`.

---

## Debug interpolator

**Case H** in the Prettier → Flix survey.

**Built-in:** Rewrites `d"..."` to `d "..."` and breaks compilation
([#13759](https://github.com/flix/flix/issues/13759)).

**Plugin:** Keeps tight `d"..."`.

**Justification (Scala):** Interpolators stay glued to the string: `s"..."`,
`f"..."`, `raw"..."` — never `s "..."`. The plugin matches that Scala rule;
the built-in’s space is not a style reference to follow.

```flix
// Plugin (= Scala interpolator adjacency)
def f(): String = d"Hello World"

// Built-in (#13759) — invalid
def f(): String = d "Hello World"
```

**Open point:** [#13759](https://github.com/flix/flix/issues/13759) (**case H**).

Fixture: `strings/debug-interpolator.md`.

---

## Package `::` and cons `::`

**Built-in:** Inserts a space in `use museum ::Clerk` and breaks the import
([#13760](https://github.com/flix/flix/issues/13760)). For **list** cons it
prefers `1 :: 2 :: Nil`.

**Plugin:** Keeps package `pkg::Mod` tight. List cons may still print tight
`1::2::Nil` today.

**Justification (Scala) for packages:** Scala paths are dotted and stay tight
(`a.b.C`). No mainstream Scala formatter inserts a space into a qualified name.
Flix package `::` must stay tight for the same reason.

**Justification (Scala + Haskell) for list cons:** Scala writes spaced infix
`1 :: 2 :: Nil`; Haskell writes spaced `1 : 2 : []`. Preferring spaced **list**
cons (toward Flix built-in *and* Scala/Haskell) is the externally justified
direction if the plugin tightens that rule later. That is separate from #13760.

**Flix docs (internal — list cons):** Official examples consistently use **spaced**
list cons, matching the built-in:

- [Lists](https://doc.flix.dev/lists.html) — `"Hello" :: "World" :: Nil`,
  `1 :: 2 :: 3 :: Nil`
- [Primitive types](https://doc.flix.dev/primitive-types.html) — `1 :: 2 :: 3 :: Nil`
- [Quick reference](https://doc.flix.dev/quick-reference.html) — same form
- [flix.dev](https://flix.dev/) — `f(x) :: map(f, xs)`, pattern `x :: xs`
- [List.flix source](https://api.flix.dev/List.src.html) — prose `v :: vs`

```flix
// Plugin / required for packages
use museum::Clerk.welcomeVisitor

// Built-in bug (#13760)
use museum ::Clerk.welcomeVisitor

// Flix docs + built-in + Scala/Haskell (list cons)
1 :: 2 :: Nil

// Plugin keeps authored cons spacing: a tight chain stays tight when it fits;
// a spaced chain stays spaced (see docs/formatting.md).
1::2::Nil
1 :: 2 :: Nil
```

**Open point:** [#13760](https://github.com/flix/flix/issues/13760) (packages only).
Preferring spaced list cons in new code matches the docs; the plugin does not
rewrite authored tight chains into spaced ones today.

Fixtures: `expressions/list-append.md`, `whitespace/package-qualifier*.md`.

---

## Type ascription (`name: Type`)

**Built-in:** Sometimes `val answer : Int32` (space before `:`).

**Plugin:** `val answer: Int32`.

**Justification (Scala):** Ascription is always `name: Type` with no space
before `:`. The plugin follows Scala (and Flix’s own prose examples); the
built-in’s space is the departure.

Haskell uses `name :: Type` with spaces around `::` — different token, not a
reason to space Flix’s single `:`.

Fixture: `declarations/module-value.md`.

---

## Type parameters and `with`

**Built-in:** `def f [a: Type] (x: a)` / `eff E [a]` — space before `[`
([#13763](https://github.com/flix/flix/issues/13763)); wrapped `with`
constraints indent once under `with` (same column as the body after `=`).
`flix format` 0.80.0 never introduces that wrap itself on compact input.

**Plugin:** Type parameters are tight on the name (`def f[a: Type]`), then a
space before the parameter list: `def f[a: Type] (x: a)`. Effect headers stay
fully tight: `eff E[a]`. Wrapped `with` lists indent **once** under `with`,
sharing the body column after `=` — same depth as flix format when a list is
already wrapped ([#273](https://github.com/wstein/prettier-plugin-flix/issues/273) /
this change). Older plugin builds indented twice; that deeper nesting is gone.

**Justification (Scala) for tight `[`:** Type parameters are tight:
`def f[A](x: A)`. scalafmt does not insert `f [A]`. That stays an external
justification for the plugin against [#13763](https://github.com/flix/flix/issues/13763).
The space before `(x: …)` is the plugin’s own parameter-list rule, not a claim
that the whole signature is glued.

**`with` indent:** No Scala/Haskell mandate for Flix `with` depth. Aligning with
flix format’s single indent is the chosen rule: the stdlib has no wrapped
`with` lists to cite, and the cost is reformatting files that already wrap
(see the Changelog trailer on this PR).

**Flix docs (internal — `with`):** Almost only **inline / flat** forms; no
multi-line `with` block with a prescribed indent depth.

- [Traits](https://doc.flix.dev/traits.html) —
  `def memberOf(...): Bool with Equatable[t] =`
- [Assert](https://doc.flix.dev/assert.html) —
  `with Eq[a], ToString[a]` on one line
- [flix.dev](https://flix.dev/) —
  `instance Eq[(a1, a2)] with Eq[a1], Eq[a2]`

**Open point:** [#13763](https://github.com/flix/flix/issues/13763) (space before
`[` only). Indent depth under `with` is settled as one level with the body.

Fixtures: `declarations/trait-constraint-lists.md`, `declarations/long-function-types.md`,
`declarations/row-type-tails.md`.

---

## Function-type arrow chains

**Built-in:** Width-less nesting of `A -> B -> C`.

**Plugin:** Breaks at `->` from print width.

**Justification (Scala + Haskell):** scalafmt wraps `A => B => C` by column
limit; Ormolu wraps `a -> b -> c` under its column limit (commonly 80). Both
ecosystems treat arrow chains as **width-sensitive**. Matching Flix’s width-less
nesting would reject the model both references use—and the model Prettier is
built on.

Fixtures: `declarations/long-function-types.md`, `declarations/signature-arrow-chain-*.md`.

---

## Record fields and `|` tails

**Built-in:** May rewrap `| tail` and pad `=` columns. Older bug joined a line
comment into the next field ([#13676](https://github.com/flix/flix/issues/13676),
**fixed**).

**Plugin:** Keeps `| tail` with the last field when it fits; documented brace
padding; comments stay attached to fields.

**Justification (Scala) for comments:** Trailing comments on fields must not
consume the next field (scalafmt preserves them)—same invariant the plugin
keeps, and the same class of bug #13676 fixed upstream.

**Open-row `|` layout — weak external:** There is no Scala clone for Flix open
rows. Haskell record update `{ r | field = e }` is only a loose analogy.

**Flix docs (internal — `|` tails):** Official examples keep `|` **on the same
line** as the fields whenever the form is short. There is no multi-line wrapping
rule for long tails.

```flix
// doc.flix.dev / flix.dev style (compact)
def g(r: {x = Int32, y = Int32 | s}): Int32 = r#x + r#y
let p2 = { x = 3 | p1 };
```

- [Records](https://doc.flix.dev/records.html) — `{x = Int32, y = Int32 | s}`,
  `{ x = 3 | p1 }`, `{ +z = 3 | p1 }`
- [Higher-kinded types](https://doc.flix.dev/higher-kinded-types.html) —
  `{x = t, y = t | r}`
- [Introduction / flix.dev examples](https://doc.flix.dev/) — polyArea
  `{x = Int32, y = Int32 | a}`

So the docs support a **compact same-line `|`** habit (closer to the plugin when
it fits) but do **not** settle how to rewrap long open-row types—the built-in’s
rewrap/`=` padding remains preference, not a cited book rule.

**Closed upstream:** [#13676](https://github.com/flix/flix/issues/13676).

Fixtures: `expressions/record-type-pattern-tails.md`, `expressions/record-update-tail.md`.

---

## Collection literals (`List#{}` / `Map#{}` / …)

**Built-in (0.80.0):** Long `Map#{…}` literals often stay on one line; column
alignment inside is lighter than the plugin’s. Older notes about breaking before
`Map#{` were not reproduced on 0.80.0.

**Plugin:** May keep `= Map#{` when compact; can align entries / tuple columns.

**Justification (Scala):** Collection and `Map(` / `Seq(` literals wrap by
width; `align` can line up `->` / `=` in maps and case clauses. Compact opener
on the same line as `=` when it fits is normal scalafmt behavior—the plugin’s
`= Map#{` is that pattern, not a Flix-specific quirk.

Haskell lists `[…]` wrap by Ormolu’s column limit (functional analogue for
homogeneous collections).

Fixtures: `expressions/align-map-entries.md`, `expressions/align-tuple-literals.md`.

---

## Pipelines, lambdas, and method dots

**Built-in:** Different `|>` / lambda breaks; may space `.` before a comment.

**Plugin:** Leading `|>`; hugged trailing lambdas when they fit; **tight**
method and qualifier dots (including beside comments).

**Justification (Scala) for dots:** Member dots stay tight (`foo.bar.baz`);
scalafmt does not write `foo. bar`. The plugin’s tight-dot rule is the Scala
rule.

**Pipeline + trailing lambda — usable Flix layout model (not a hard law):**
External Scala/Haskell analogies for `|>` + trailing lambdas are limited. Flix’s
own book is the better internal reference:

```flix
// doc.flix.dev/functions.html — trailing |>, short lambdas stay on the call line
List.range(1, 100) |>
List.filter(x -> x `Int32.mod` 2 == 0) |>
List.map(x -> x * x) |>
println;

let l = 1 :: 2 :: 3 :: Nil;
l |>
List.map(x -> x * 2) |>
List.filter(x -> x < 4) |>
List.count(x -> x > 1)
```

- [Functions (pipelines)](https://doc.flix.dev/functions.html)

The book puts `|>` at the end of each line and keeps short lambdas inline.
The plugin starts each wrapped step with `|>`, following the
[F# pipeline formatting guidelines](https://learn.microsoft.com/en-us/dotnet/fsharp/style-guide/formatting#formatting-pipeline-expressions).
The plugin also keeps a fitting trailing lambda in the call, with its body
laid out according to the configured width.

Fixtures: `expressions/pipeline-trailing-lambda.md`, `whitespace/tight-dot-comments.md`.

---

## `par` / `yield`

**Built-in:** Breaks before `yield` and indents the body.

**Plugin:** May keep short `) yield …` together when width allows.

**Flix docs (internal — clear built-in support):** Every official `par` /
`yield` example breaks **before** `yield` and indents:

```flix
par (x <- e1; y <- e2; z <- e3)
    yield x + y + z

par (r <- f(x); rs <- parMap(f, xs))
    yield r :: rs
```

- [Parallelism](https://doc.flix.dev/parallelism.html)
- [flix.dev](https://flix.dev/) (parMap feature example)

Scala `for` / `yield` and Haskell `do` only justify *that* generators wrap by
width; they do **not** override this Flix-specific break-before-`yield`
convention. Prefer documenting the built-in’s break as the book style when the
plugin diverges.

Fixtures: `expressions/par-yield-layout.md`.

---

## Guarded `match` and Datalog `query`

**Built-in:** Flatter / more fixed breaks for long guards and `query` lists.

**Plugin:** Width-driven breaks for long guards and `query` clauses.

**Guarded `match`:** Scala/Haskell width wrapping for long guards remains a fair
external justification for the plugin; Flix docs do not prescribe a unique
guard layout.

**Datalog — usable Flix layout model:** Short queries stay on one line; longer
ones break **after the constraint inputs**, then indent `select … from`. Rules
are typically one fact/rule per line inside `#{…}`.

```flix
// compact (fixpoints.html)
let paths = query edges, rules select true from Path(src, dst);

// longer — break before select (fixpoints.html / stratified-negation.html)
query getParents(), getAdoptions(), withAncestors()
    select (x, y) from AncestorOf(x, y) |> println

query movies, actors, directors, rule
    select title from MovieWithoutDirector(title) |> println
```

- [Fixpoints](https://doc.flix.dev/fixpoints.html)
- [Stratified negation](https://doc.flix.dev/stratified-negation.html)
- [Local predicates](https://doc.flix.dev/local-predicates.html)

There is no Scala/Haskell Datalog analogue. Use these book examples as the
**internal** reference when judging whether a plugin wrap of the input list is
still “Flix-like.”

Fixtures: `expressions/guarded-match-*.md`, `datalog/query-list-wrap.md`.

---

## Declaration blanks and Flixdoc

**Built-in:** Own brace blank-line habits; Flixdoc edge cases differ.

**Plugin:** Documented blanks for `mod` / `trait` / `instance` / `eff` /
`struct`; enum opener blanks dropped; Flixdoc attachment rules in the style
guide.

**Justification (Scala / Haskell) for Flixdoc attachment:** Docs stick to the
following definition (`/** */` / Haddock `-- |`). That part is externally
supported.

**Blank lines / enum openers — barely specified in Flix docs:** Official enums
put cases **immediately** after `{` with no blank after the opener, but there
is no written rule for blanks between members or for comments on the opener
line.

```flix
// automatic-derivation.html — cases right after the brace
enum Shape with Eq, Order {
    case Circle(Int32)
    case Square(Int32)
    case Rectangle(Int32, Int32)
}
```

- [Automatic derivation](https://doc.flix.dev/automatic-derivation.html)
- [List.flix source](https://api.flix.dev/List.src.html) — `enum List[t] { … }`

Do **not** claim a Flix-book convention for the plugin’s `mod`/`trait` blank
scheme versus the built-in’s; only the “no blank before the first `case`”
pattern is visible in examples.

Fixtures: `declarations/comment-only-declaration-braces.md`,
`declarations/enum-opener-comment-gap.md`, `comments/attach-flixdoc.md`.

---

## Line endings inside comments

**Built-in:** CRLF→LF can leave `\r` inside a line comment
([#13767](https://github.com/flix/flix/issues/13767)).

**Plugin:** Normalizes to Prettier’s end-of-line; no stranded `\r` in comment
text.

**Justification (Scala / Haskell):** scalafmt and Ormolu normalize newlines; they
do not leave CR inside comment payloads after conversion. Preserving mixed EOLs
inside comments is not a reference behavior.

**Open point:** [#13767](https://github.com/flix/flix/issues/13767).

---

## Decision cheat sheet

| Situation | Reference to follow |
| --- | --- |
| Built-in **breaks or deletes** code/comments (#13758–#13762, #13759, #13760, #13767) | Keep valid Prettier output; cite Scala (and Haskell) for not destroying tokens/comments |
| Built-in **style** vs Scala-like surface (`name: Type`, `f[A]`, tight `.`, tight `pkg::`) | Follow **Scala / scalafmt** |
| Built-in **style** vs FP operators (list cons spaces, arrow/comprehension width) | Follow **Scala and/or Haskell** *and* Flix book examples where they agree (spaced `::`) |
| Prettier-only features (comment align, `prettier-ignore`, print width) | Cite Scala `align` / `format: off` / `maxColumn` (and Haskell column limits) |
| Flix-only constructs with clear book layout (`par`/`yield`, compact record `\|`, Datalog `query`/`select`, pipeline `\|>`) | Cite **[doc.flix.dev](https://doc.flix.dev/) / [flix.dev](https://flix.dev/)** as the internal style reference; do not invent an external analogue |
| Barely specified upstream (declaration blanks) | Record both outputs; do **not** claim a Flix-book or Scala/Haskell mandate |
| Wrapped `with` indent | Match **flix format**: one level under `with`, same column as the body ([#273](https://github.com/wstein/prettier-plugin-flix/issues/273)) |

## Related pages

- [Flix formatting style](formatting.md) — normative plugin rules
- [Relation to flix format](formatting.md#relation-to-flix-format) — stdlib measurements
- Fixture catalog — runnable samples for each construct
