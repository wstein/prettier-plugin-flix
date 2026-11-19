---
title: A line comment right after = keeps the body on the next line
flix: "0.80"
---

## Input

```flix
def g(x: Int32): Int32 = // after the equals sign
    x + 1

def h(x: Int32): Int32 = // note
x + 1
```

## Output

```flix
def g(x: Int32): Int32 = // after the equals sign
    x + 1

def h(x: Int32): Int32 = // note
    x + 1
```
