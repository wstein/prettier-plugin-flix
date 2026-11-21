---
title: "Do not break a call only because a block comment ends its source line before a comma"
description: "A newline between a trailing block comment and the next argument comma is not a layout signal; both passes keep the comment with the argument."
group: "Line endings and comment placement"
flix: "0.80"
options: { printWidth: 80 }
---

## Input

```flix
def f(x: Int32): Int32 =
    foo(x /* c */
    , x + 1, x + 2)
```

## Output

```flix
def f(x: Int32): Int32 = foo(x /* c */, x + 1, x + 2)
```

```flix printWidth=40
def f(x: Int32): Int32 =
    foo(x /* c */, x + 1, x + 2)
```

```flix printWidth=100
def f(x: Int32): Int32 = foo(x /* c */, x + 1, x + 2)
```
