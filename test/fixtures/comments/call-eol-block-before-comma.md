---
title: "Do not break a list only because a block comment ends its source line before a separator"
description: "A newline between a trailing block comment and the next `,` or `;` is not a layout signal; both passes keep the comment with the item before the separator."
group: "Line endings and comment placement"
options: { printWidth: 80 }
---

## Input

```flix
def f(x: Int32): Int32 =
    foo(x /* c */
    , x + 1, x + 2)

def g(l: List[Int32], m: List[Int32]): List[Int32] =
    forM (x <- l /* c */
    ; y <- m) yield x + y
```

## Output

```flix
def f(x: Int32): Int32 = foo(x /* c */, x + 1, x + 2)

def g(l: List[Int32], m: List[Int32]): List[Int32] =
    forM (x <- l /* c */; y <- m) yield x + y
```

```flix printWidth=40
def f(x: Int32): Int32 =
    foo(x /* c */, x + 1, x + 2)

def g(l: List[Int32], m: List[Int32]):
    List[Int32] =
    forM (
        x <- l /* c */;
        y <- m
    ) yield x + y
```

```flix printWidth=100
def f(x: Int32): Int32 = foo(x /* c */, x + 1, x + 2)

def g(l: List[Int32], m: List[Int32]): List[Int32] = forM (x <- l /* c */; y <- m) yield x + y
```
