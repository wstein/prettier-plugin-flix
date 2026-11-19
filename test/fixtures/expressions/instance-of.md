---
title: "Java instanceof expression"
group: "Additional language constructs"
flix: "0.80"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Exp.Jvm.Instanceof.flix#L70"
---

## Input

```flix
@Test
def testInstanceof14(): Unit \ Assert =
    assertFalse(123 instanceof Number)
```

## Output

```flix
@Test
def testInstanceof14(): Unit \ Assert = assertFalse(123 instanceof Number)
```
