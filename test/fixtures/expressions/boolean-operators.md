---
title: "Boolean or and not"
group: "Additional language constructs"
flix: "0.80"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Exp.Binary.Bool.flix#L37"
---

## Input

```flix
@Test
def binaryLogical04b(): Unit \ Assert =
    assertEq(expected = true, true or not true)
```

## Output

```flix
@Test
def binaryLogical04b(): Unit \ Assert =
    assertEq(expected = true, true or not true)
```
