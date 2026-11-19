---
title: "Call a superclass constructor"
group: "Additional language constructs"
flix: "0.80"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/ca/uwaterloo/flix/language/phase/TestResolver.scala#L3372"
---

## Input

```flix
def foo(): Unit \ IO =
    let _ = new S { def new(): S \ IO = super() };
    ()
```

## Output

```flix
def foo(): Unit \ IO =
    let _ = new S { def new (): S \ IO = super() };
    ()
```
