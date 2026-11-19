---
title: Block comments around a field-access arrow stay glued to it
flix: "0.80"
---

## Input

```flix
def f(s: S[r]): Int32 = s/* c */->/* c */fst
```

## Output

```flix
def f(s: S[r]): Int32 = s/* c */->/* c */fst
```
