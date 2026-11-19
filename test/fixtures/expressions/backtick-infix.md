---
title: "Backtick infix call"
group: "Additional language constructs"
flix: "0.80"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Exp.Infix.flix#L9"
---

## Input

```flix
@Test
def testInfix02(): Unit \ Assert =
    assertEq(expected = 1 - 2, 1 `sub` 2)
```

## Output

```flix
@Test
def testInfix02(): Unit \ Assert = assertEq(expected = 1 - 2, 1 `sub` 2)
```
