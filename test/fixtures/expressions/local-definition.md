---
title: "Declare a local function"
group: "Additional language constructs"
flix: "0.80"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Eff.SubEffecting.flix#L323"
---

## Input

```flix
def mkInc2(): Int32 -> Int32 \ IO =
    def step(x) = x + 1;
    step
```

## Output

```flix
def mkInc2(): Int32 -> Int32 \ IO =
    def step(x) = x + 1;
    step
```
