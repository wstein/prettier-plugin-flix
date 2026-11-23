---
title: Interpolated expressions are formatted tight
description: "The formatter spaces the expression inside interpolation while preserving the surrounding string."
---

## Input

```flix
def f(x: Int32): String = "a ${x+1} b"
```

## Output

```flix
def f(x: Int32): String = "a ${x + 1} b"
```
