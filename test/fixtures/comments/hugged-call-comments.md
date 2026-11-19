---
title: Line comments inside a call whose last argument is a block stay at their boundary
flix: "0.80"
---

## Input

```flix
def a(): Unit = g(1, // after the comma
    x -> { println(x) })

def b(): Unit = g(1 // before the comma
    , x -> { println(x) })

def c(): Unit = g(1,
    // on its own line
    x -> { println(x) })
```

## Output

```flix
def a(): Unit = g(
    1, // after the comma
    x -> { println(x) }
)

def b(): Unit = g(
    1, // before the comma
    x -> { println(x) }
)

def c(): Unit = g(
    1,
    // on its own line
    x -> { println(x) }
)
```
