---
title: "Keep an own-line comment on its own line after a block comment in a match arm"
description: "A block comment that ends its line in a match pattern must not pull the following own-line comment onto the same line."
group: "Line endings and comment placement"
options: { printWidth: 100 }
---

## Input

```flix
def headOf(xs: List[Int32]): Int32 = match xs {
    case x/* head */::/* tail */
// own
_ => x
    case Nil => 0
}
```

## Output

```flix
def headOf(xs: List[Int32]): Int32 = match xs {
    case x/* head */::/* tail */
        // own
        _ => x
    case Nil => 0
}
```

```flix printWidth=40
def headOf(
    xs: List[Int32]
): Int32 = match xs {
    case x/* head */::/* tail */
        // own
        _ => x
    case Nil => 0
}
```
