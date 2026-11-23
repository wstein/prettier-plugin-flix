---
title: "Keep a fitting operator chain after a standalone comment"
description: "Standalone comments above an operator chain leave the chain free to fit on one line."
---

## Input

```flix
def total(a: Int32, b: Int32): Int32 =
    // Add the inputs.
    a + b

def both(a: Bool, b: Bool): Bool =
    // Both inputs must be true.
    a and b

def lines(a: String, b: String): String =
    // Join the lines.
    a + "\n" + b
```

## Output

```flix
def total(a: Int32, b: Int32): Int32 =
    // Add the inputs.
    a + b

def both(a: Bool, b: Bool): Bool =
    // Both inputs must be true.
    a and b

def lines(a: String, b: String): String =
    // Join the lines.
    a + "\n" + b
```
