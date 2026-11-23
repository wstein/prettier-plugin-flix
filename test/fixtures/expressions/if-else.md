---
title: If, else-if and else
description: "The condition and all three branches keep their order in a compact conditional."
---

## Input

```flix
def sign(x: Int32): Int32 = if (x < 0) -1 else if (x == 0) 0 else 1
```

## Output

```flix
def sign(x: Int32): Int32 = if (x < 0) -1 else if (x == 0) 0 else 1
```
