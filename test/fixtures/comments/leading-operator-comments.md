---
title: "Keep a fitting operator chain after a standalone comment"
description: "Standalone comments above an operator chain leave the chain free to fit on one line."
flix: "0.80"
---

## Input

```flix
def total(a: Int32, b: Int32): Int32 =
    // Add the inputs.
    a + b

def both(a: Bool, b: Bool): Bool =
    // Both inputs must be true.
    a and b
```

## Output

```flix
def total(a: Int32, b: Int32): Int32 =
    // Add the inputs.
    a + b

def both(a: Bool, b: Bool): Bool =
    // Both inputs must be true.
    a and b
```
