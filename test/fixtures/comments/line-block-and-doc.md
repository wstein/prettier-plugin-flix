---
title: Line, doc and block comments stay beside their code
flix: "0.80"
---

## Input

```flix
// header


def a(): Int32 = 1 // trailing

/// doc
def b(): Int32 = {
    // inside
    2
}

def c(x /* name */ : Int32): Int32 = x
```

## Output

```flix
// header

def a(): Int32 = 1 // trailing

/// doc
def b(): Int32 = {
    // inside
    2
}

def c(x /* name */: Int32): Int32 = x
```
