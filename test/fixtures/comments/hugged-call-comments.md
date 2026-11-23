---
title: Line comments inside a call whose last argument is a block stay at their boundary
description: "A call that usually keeps a trailing lambda close must still respect line comments between arguments."
group: "Calls, blocks, and control flow"
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
    1,  // after the comma
    x -> { println(x) }
)

def b(): Unit = g(
    1,  // before the comma
    x -> { println(x) }
)

def c(): Unit = g(
    1,
    // on its own line
    x -> { println(x) }
)
```
