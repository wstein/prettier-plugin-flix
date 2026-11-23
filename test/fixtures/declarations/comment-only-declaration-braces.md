---
title: "Preserve source gaps in comment-only declaration bodies"
description: "A comment may follow the opening brace directly or start after a blank line. A blank line between comments stays visible."
group: "Declarations"
flix: "0.80"
options: { printWidth: 80 }
---

## Input

```flix
trait QuietTrait[a] {
    /* Tight comment. */
}

trait GapTrait[a] {

    // Keep the opening gap.
}

trait MixedTrait[a] {
    /* First comment. */

    // Second comment.
}

instance QuietTrait[Int32] { /* Tight comment. */ }

instance GapTrait[Int32] {

    // Keep the opening gap.
}

instance MixedTrait[Int32] {
    /* First comment. */

    // Second comment.
}

eff QuietEffect { /* Tight comment. */ }

eff GapEffect {

    // Keep the opening gap.
}

eff MixedEffect {
    /* First comment. */

    // Second comment.
}

struct QuietStruct[r] { /* Tight comment. */ }

struct GapStruct[r] {

    // Keep the opening gap.
}

struct MixedStruct[r] {
    /* First comment. */

    // Second comment.
}

pub def noParams(

    /* The parameter list is empty. */
): Unit = ()
```

## Output

```flix
trait QuietTrait[a] {
    /* Tight comment. */
}

trait GapTrait[a] {

    // Keep the opening gap.
}

trait MixedTrait[a] {
    /* First comment. */

    // Second comment.
}

instance QuietTrait[Int32] {
    /* Tight comment. */
}

instance GapTrait[Int32] {

    // Keep the opening gap.
}

instance MixedTrait[Int32] {
    /* First comment. */

    // Second comment.
}

eff QuietEffect {
    /* Tight comment. */
}

eff GapEffect {

    // Keep the opening gap.
}

eff MixedEffect {
    /* First comment. */

    // Second comment.
}

struct QuietStruct[r] {
    /* Tight comment. */
}

struct GapStruct[r] {

    // Keep the opening gap.
}

struct MixedStruct[r] {
    /* First comment. */

    // Second comment.
}

pub def noParams(

    /* The parameter list is empty. */
): Unit = ()
```

```flix printWidth=40
trait QuietTrait[a] {
    /* Tight comment. */
}

trait GapTrait[a] {

    // Keep the opening gap.
}

trait MixedTrait[a] {
    /* First comment. */

    // Second comment.
}

instance QuietTrait[Int32] {
    /* Tight comment. */
}

instance GapTrait[Int32] {

    // Keep the opening gap.
}

instance MixedTrait[Int32] {
    /* First comment. */

    // Second comment.
}

eff QuietEffect {
    /* Tight comment. */
}

eff GapEffect {

    // Keep the opening gap.
}

eff MixedEffect {
    /* First comment. */

    // Second comment.
}

struct QuietStruct[r] {
    /* Tight comment. */
}

struct GapStruct[r] {

    // Keep the opening gap.
}

struct MixedStruct[r] {
    /* First comment. */

    // Second comment.
}

pub def noParams(

    /* The parameter list is empty. */
): Unit = ()
```
