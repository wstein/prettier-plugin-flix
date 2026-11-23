---
title: An inline block comment stays on its line
description: "An inline block comment belongs on the same line as its surrounding tokens."
group: "Line endings and comment placement"
---

## Input

```flix
def a(): Int32 = if (true) 1 /* c */ else 2

def b(x: Int32 /* first */, y /* second */ : Int32): Int32 = x + /* sum */ y
```

## Output

```flix
def a(): Int32 = if (true) 1 /* c */ else 2

def b(x: Int32 /* first */, y /* second */: Int32): Int32 = x + /* sum */ y
```
