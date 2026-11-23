---
title: Block comments around a field-access arrow stay glued to it
description: "Block comments can touch a field-access arrow on either side. Keeping those boundaries tight preserves the token class."
group: "Whitespace-sensitive operators"
---

## Input

```flix
def f(s: S[r]): Int32 = s/* c */->/* c */fst
```

## Output

```flix
def f(s: S[r]): Int32 = s/* c */->/* c */fst
```
