---
title: "Operator section used as a function"
group: "Additional language constructs"
flix: "0.80"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Exp.Lambda.Op.flix#L49"
---

## Input

```flix
@Test
def testLambdaOpLess01(): Unit \ Assert =
    let f = (<);
    assertTrue(f(2, 3))
```

## Output

```flix
@Test
def testLambdaOpLess01(): Unit \ Assert =
    let f = (<);
    assertTrue(f(2, 3))
```
