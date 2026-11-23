---
title: "Hole annotated with a local variable"
group: "Additional language constructs"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Exp.HoleWithExp.flix#L3"
---

## Input

```flix
@CompileTest
def testHoleWithExp01(): Int32 = match (None : Option[Int32]) {
    case None    => 1
    case Some(n) => n?
}
```

## Output

```flix
@CompileTest
def testHoleWithExp01(): Int32 = match (None: Option[Int32]) {
    case None    => 1
    case Some(n) => n?
}
```
