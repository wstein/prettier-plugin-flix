---
title: "Call a superclass method"
group: "Additional language constructs"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Exp.Jvm.NewObject.Super.flix#L109"
---

## Input

```flix
@Test
def testSuperMethod10(): Unit \ Assert + IO =
    let obj = new Object {
        def toString(_this: Object): String \ IO =
            super.toString()
    };
    let s = obj.toString();
    assertEq(expected = s, s)
```

## Output

```flix
@Test
def testSuperMethod10(): Unit \ Assert + IO =
    let obj = new Object {
        def toString(_this: Object): String \ IO = super.toString()
    };
    let s = obj.toString();
    assertEq(expected = s, s)
```
