---
title: A line comment right after a field-access arrow keeps the arrow tight
flix: "0.80"
---

## Input

```flix
def f(s: S[r]): Int32 = s->// keep
field

def g(s: S[r]): Int32 = s->/* c */field
```

## Output

```flix
def f(s: S[r]): Int32 = s->// keep
field

def g(s: S[r]): Int32 = s->/* c */field
```
