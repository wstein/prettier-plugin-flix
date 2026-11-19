---
title: A line comment between a declaration head and its = stays before the =
description: "The equals sign belongs to the declaration and must remain outside the preceding line comment."
group: "Calls, blocks, and control flow"
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
