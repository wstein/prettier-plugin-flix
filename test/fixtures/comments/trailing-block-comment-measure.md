---
title: "Measure a trailing block comment the same way when it ends a line"
description: "A block comment after = or before a closing paren must not change wrap choices between passes."
group: "Line endings and comment placement"
flix: "0.80"
options: { printWidth: 40 }
---

## Input

```flix
pub def concatenate(): List[Int32] = /* note */ (1::2::Nil) ::: (3::4::Nil) ::: Nil

def pair(value: Int32): (Int32, Int32) = (Int32.abs(Int32.abs(value) /* note */), Int32.abs(value))

type alias CommentedRow[r: RecordRow] = /* note */ (name = String, description = String | r)
```

## Output

```flix
pub def concatenate(): List[
    Int32
] = /* note */
    (1::2::Nil) ::: (3::4::Nil) ::: Nil

def pair(value: Int32): (Int32, Int32) =
    (
        Int32.abs(
            Int32.abs(value) /* note */
        ),
        Int32.abs(value)
    )

type alias CommentedRow[
    r: RecordRow
] = /* note */
    (
        name = String,
        description = String | r
    )
```

```flix printWidth=30
pub def concatenate():
    List[Int32] = /* note */
    (1::2::Nil) :::
        (3::4::Nil) :::
        Nil

def pair(value: Int32): (
    Int32,
    Int32
) =
    (
        Int32.abs(
            Int32.abs(
                value
            ) /* note */
        ),
        Int32.abs(value)
    )

type alias CommentedRow[
    r: RecordRow
] = /* note */
    (
        name = String,
        description = String
        | r
    )
```

```flix printWidth=100
pub def concatenate(): List[Int32] = /* note */ (1::2::Nil) ::: (3::4::Nil) ::: Nil

def pair(value: Int32): (Int32, Int32) = (Int32.abs(Int32.abs(value) /* note */), Int32.abs(value))

type alias CommentedRow[r: RecordRow] = /* note */ (name = String, description = String | r)
```
