---
title: A line comment right after a field-access arrow keeps the arrow tight
description: "The line comment needs a following newline, while the arrow must stay immediately adjacent to the comment."
group: "Whitespace-sensitive operators"
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
