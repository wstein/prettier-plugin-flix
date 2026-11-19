---
title: "Parallel binding with yield"
group: "Additional language constructs"
flix: "0.80"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Exp.ParYield.flix#L21"
---

## Input

```flix
@Test
def testParYield04(): Unit \ Assert =
    let r = par (a <- let a = 1; a) yield a;
    assertEq(expected = 1, r)
```

## Output

```flix
@Test
def testParYield04(): Unit \ Assert =
    let r = par (
        a <- let a = 1;
        a
    ) yield a;
    assertEq(expected = 1, r)
```
