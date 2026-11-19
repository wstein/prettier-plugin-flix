---
title: "Checked Java upcast"
group: "Additional language constructs"
flix: "0.80"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Exp.CheckedCast.flix#L70"
---

## Input

```flix
def upcast(x: Num): Object = checked_cast(Box.box(x))
```

## Output

```flix
def upcast(x: Num): Object = checked_cast(Box.box(x))
```
