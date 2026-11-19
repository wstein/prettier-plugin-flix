---
title: A long else-if chain breaks every branch, not only the first
description: "The desired output wraps each branch of a long condition. All branches use the same layout when the chain breaks."
flix: "0.80"
options:
  printWidth: 30
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
