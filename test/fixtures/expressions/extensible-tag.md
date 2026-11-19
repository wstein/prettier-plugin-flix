---
title: "Construct an extensible variant"
group: "Additional language constructs"
flix: "0.80"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Exp.ExtMatch.flix#L586"
---

## Input

```flix
def generatesA(): #| A(Int32) |# = xvar A(1)
```

## Output

```flix
def generatesA(): #| A(Int32) |# = xvar A(1)
```
