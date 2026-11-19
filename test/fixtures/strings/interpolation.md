---
title: Interpolated expressions are formatted tight
flix: "0.80"
---

## Input

```flix
def f(x: Int32): String = "a ${x+1} b"
```

## Output

```flix
def f(x: Int32): String = "a ${x + 1} b"
```
