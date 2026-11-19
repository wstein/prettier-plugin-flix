---
title: A long else-if chain breaks every branch, not only the first
flix: "0.80"
options:
  printWidth: 30
status: todo
issue: nested else-if groups break independently
---

## Input

```flix
def sign(x: Int32): Int32 = if (x < 0) -1 else if (x == 0) 0 else 1
```

## Output

```flix
def sign(x: Int32): Int32 =
    if (x < 0)
        -1
    else if (x == 0)
        0
    else
        1
```
