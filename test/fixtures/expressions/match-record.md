---
title: "Match record fields with Boolean operators"
group: "Additional language constructs"
flix: "0.80"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Exp.Match.Record.flix#L240"
---

## Input

```flix
@Test
def duplicateLabels01(): Unit \ Assert = match { a = false, a = true } {
    case { a = x, a = y } => assertTrue((not x) and y)
}
```

## Output

```flix
@Test
def duplicateLabels01(): Unit \ Assert = match {a = false, a = true} {
    case {a = x, a = y} => assertTrue((not x) and y)
}
```
