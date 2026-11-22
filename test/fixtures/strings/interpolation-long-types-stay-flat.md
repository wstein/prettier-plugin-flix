---
title: "Keep a long function type and a row tail on one line inside an interpolation"
description: "Inside `${...}` the formatter prints types and record rows flat, so a function type and a record update with a `|` tail do not wrap at narrow widths."
group: "String forms"
flix: "0.80"
options: { printWidth: 50 }
---

## Input

```flix
def f(x: Int32): String = "a ${(g: (Aaaaaaaaaaaaaa, Bbbbbbbbbbbbbbb, Cccccccccccccc) -> Ddddddddddddddd -> Eeeeeeeeeeeeee)} b"
def h(x: Int32): String = "a ${{ aaaaaaaaaaaaaaaa = 1, bbbbbbbbbbbbbbbbbbb = 2, cccccccccccccccccc = 3 | rrrrrrrrrrrrrrrrr }} b"
```

## Output

```flix
def f(x: Int32): String =
    "a ${(g: (Aaaaaaaaaaaaaa, Bbbbbbbbbbbbbbb, Cccccccccccccc) -> Ddddddddddddddd -> Eeeeeeeeeeeeee)} b"
def h(x: Int32): String =
    "a ${{ aaaaaaaaaaaaaaaa = 1, bbbbbbbbbbbbbbbbbbb = 2, cccccccccccccccccc = 3 | rrrrrrrrrrrrrrrrr }} b"
```

```flix printWidth=60
def f(x: Int32): String =
    "a ${(g: (Aaaaaaaaaaaaaa, Bbbbbbbbbbbbbbb, Cccccccccccccc) -> Ddddddddddddddd -> Eeeeeeeeeeeeee)} b"
def h(x: Int32): String =
    "a ${{ aaaaaaaaaaaaaaaa = 1, bbbbbbbbbbbbbbbbbbb = 2, cccccccccccccccccc = 3 | rrrrrrrrrrrrrrrrr }} b"
```
