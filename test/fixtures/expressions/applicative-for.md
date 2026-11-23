---
title: "Applicative for with tuple patterns"
group: "Additional language constructs"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Exp.ForA.flix#L160"
---

## Input

```flix
@Test
def testApplicativeFor14(): Unit \ Assert =
    let res = forA (
        (a, b) <- (s((1, 2)): Validation[String, (Int32, Int32)]);
        (c, d) <- f("err")
    ) yield (a + b) * c + d;
    assertEq(expected = f("err"), res)
```

## Output

```flix
@Test
def testApplicativeFor14(): Unit \ Assert =
    let res =
        forA (
            (a, b) <- (s((1, 2)): Validation[String, (Int32, Int32)]);
            (c, d) <- f("err")
        ) yield (a + b) * c + d;
    assertEq(expected = f("err"), res)
```
