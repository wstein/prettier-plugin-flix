---
title: Align match arrows above mixed body lengths
description: "Align the case heads even when one case contains multiple statements."
flix: "0.80"
---

## Input

```flix
def next(xs: List[Int32]): Int32 = match xs {
case Nil => 0
case x :: _ => let result = x + 1; result
}
```

## Output

```flix
def next(xs: List[Int32]): Int32 = match xs {
    case Nil    => 0
    case x :: _ =>
        let result = x + 1;
        result
}
```
