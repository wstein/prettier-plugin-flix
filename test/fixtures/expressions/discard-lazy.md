---
title: "Discard a lazy expression"
group: "Additional language constructs"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Exp.Lazy.flix#L55"
---

## Input

```flix
@CompileTest
def testArrayOfIntLazy01(): Unit = region rc {
    discard {
        let array = Array#{1, 2} @ rc;
        lazy array
    }
}
```

## Output

```flix
@CompileTest
def testArrayOfIntLazy01(): Unit = region rc {
    discard {
        let array = Array#{1, 2} @ rc;
        lazy array
    }
}
```
