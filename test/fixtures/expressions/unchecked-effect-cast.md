---
title: "Unchecked cast with an effect set"
group: "Additional language constructs"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Exp.UncheckedEffectCast.flix#L154"
---

## Input

```flix
@CompileTest
def testUncheckedEffectCast43(): Unit = region rc {
    let _ = unchecked_cast(f(%%ARRAY_NEW%%(rc, 'A', 8)) as _ \ {});
    ()
}
```

## Output

```flix
@CompileTest
def testUncheckedEffectCast43(): Unit = region rc {
    let _ = unchecked_cast(f(%%ARRAY_NEW%% (rc, 'A', 8)) as _ \ {});
    ()
}
```
