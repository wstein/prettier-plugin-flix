---
title: "Align match arms when a block comment in a pattern wraps the arm head"
description: "A block comment inside a case pattern breaks the pattern over several lines; the arrow column of the other arms is measured as if the comment did not break the head, so it is not taken from the wrapped arm's head."
group: "Line endings and comment placement"
options: { printWidth: 40 }
---

## Input

```flix
def f(x: Option[Int32]): Int32 = {let y = 1;
match x { /* note */ case Some(v /* note */) => v+y
case None => y}}
```

## Output

```flix
def f(x: Option[Int32]): Int32 = {
    let y = 1;
    match x {
        /* note */ case Some(
            v /* note */
        ) => v + y
        case None               => y
    }
}
```
