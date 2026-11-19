---
title: A comment after a closing bracket does not break the call
description: "A trailing comment on the call as a whole must not make the argument list expand."
group: "Calls, blocks, and control flow"
flix: "0.80"
---

## Input

```flix
def f(): Int32 = g(1) // trailing
def h(): Int32 = k(a, b) /* inline */
```

## Output

```flix
def f(): Int32 = g(1)  // trailing
def h(): Int32 = k(a, b) /* inline */
```
