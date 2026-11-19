---
title: "Select a Java field"
group: "Additional language constructs"
flix: "0.80"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Exp.Jvm.GetField.flix#L10"
---

## Input

```flix
@Test
def testGetField02(): Unit \ Assert + IO =
    assertEq(expected = 43, new Point(42, 43).y)
```

## Output

```flix
@Test
def testGetField02(): Unit \ Assert + IO =
    assertEq(expected = 43, new Point(42, 43).y)
```
