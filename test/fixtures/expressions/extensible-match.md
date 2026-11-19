---
title: "Match an extensible variant"
group: "Additional language constructs"
flix: "0.80"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/ca/uwaterloo/flix/language/phase/TestRedundancy.scala#L91"
---

## Input

```flix
def f(): Int32 =
    ematch xvar A(123) {
        case A(_x) => _x
    }
```

## Output

```flix
def f(): Int32 =
    ematch xvar A(123) {
        case A(_x) => _x
    }
```
