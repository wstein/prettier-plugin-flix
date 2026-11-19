---
title: A comment after a closing bracket does not break the call
flix: "0.80"
---

## Input

```flix
def f(): Int32 = g(1) // trailing
def h(): Int32 = k(a, b) /* inline */
```

## Output

```flix
def f(): Int32 = g(1) // trailing
def h(): Int32 = k(a, b) /* inline */
```
