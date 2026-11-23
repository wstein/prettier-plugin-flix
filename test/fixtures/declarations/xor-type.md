---
title: "Exclusive or in a type argument"
group: "Types and constraints"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Type.Bool.flix#L680"
---

## Input

```flix
def inc4(_: I4[a, b, c, d]): I4[a xor (b and c and d), b xor (c and d), c xor d, not d] = I4.I4
```

## Output

```flix
def inc4(_: I4[a, b, c, d]):
    I4[a xor (b and c and d), b xor (c and d), c xor d, not d] = I4.I4
```
