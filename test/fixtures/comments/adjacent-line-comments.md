---
title: Line comments on neighboring tokens stay separate comments
flix: "0.80"
---

## Input

```flix
def a(): Unit = g(1 // before the comma
    , // after the comma
    x -> { println(x) })

def b(): Int32 = x + // after the operator
    y
```

## Output

```flix
def a(): Unit = g(
    1, // before the comma
    // after the comma
    x -> { println(x) }
)

def b(): Int32 = x + // after the operator
    y
```
