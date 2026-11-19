---
title: A line comment between a declaration head and its = stays before the =
flix: "0.80"
---

## Input

```flix
def f(x: a): Bool with Eq[a] // c
    = x == x
```

## Output

```flix
def f(x: a): Bool with Eq[a] // c
    = x == x
```
