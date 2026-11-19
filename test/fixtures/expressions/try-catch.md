---
title: "Try and catch a Java exception"
group: "Additional language constructs"
flix: "0.80"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Exp.Jvm.TryCatch.flix#L10"
---

## Input

```flix
@Test
def testNoException01(): Unit \ Assert =
    try {
        success("no exception thrown")
    } catch {
        case _: Exception => fail("unexpected exception")
    }
```

## Output

```flix
@Test
def testNoException01(): Unit \ Assert =
    try {
        success("no exception thrown")
    } catch {
        case _: Exception => fail("unexpected exception")
    }
```
