---
title: Parallel bindings wrap inside par
description: "A compact par fits on one line. When it wraps, the bindings break first."
options: { printWidth: 45 }
---

## Input

```flix
def f():Int32={
let value=par (x <- 1;y <- 2) yield x+y;
value
}

def withLongName():Int32={
let thirtyLettersInThisBindingName=par (x <- 1;y <- 2) yield x+y;
thirtyLettersInThisBindingName
}

def underCase(n:Int32):Int32=match n{
case 0 => 0
case _ =>
// Use both results.
par (left <- n;right <- 2) yield left+right
}
```

## Output

```flix
def f(): Int32 = {
    let value = par (
        x <- 1;
        y <- 2
    ) yield x + y;
    value
}

def withLongName(): Int32 = {
    let thirtyLettersInThisBindingName =
        par (x <- 1; y <- 2) yield x + y;
    thirtyLettersInThisBindingName
}

def underCase(n: Int32): Int32 = match n {
    case 0 => 0
    case _ =>
        // Use both results.
        par (
            left <- n;
            right <- 2
        ) yield left + right
}
```

```flix printWidth=36
def f(): Int32 = {
    let value = par (
        x <- 1;
        y <- 2
    ) yield x + y;
    value
}

def withLongName(): Int32 = {
    let thirtyLettersInThisBindingName =
        par (
            x <- 1;
            y <- 2
        ) yield x + y;
    thirtyLettersInThisBindingName
}

def underCase(
    n: Int32
): Int32 = match n {
    case 0 => 0
    case _ =>
        // Use both results.
        par (
            left <- n;
            right <- 2
        ) yield left + right
}
```

```flix printWidth=80
def f(): Int32 = {
    let value = par (x <- 1; y <- 2) yield x + y;
    value
}

def withLongName(): Int32 = {
    let thirtyLettersInThisBindingName = par (x <- 1; y <- 2) yield x + y;
    thirtyLettersInThisBindingName
}

def underCase(n: Int32): Int32 = match n {
    case 0 => 0
    case _ =>
        // Use both results.
        par (left <- n; right <- 2) yield left + right
}
```
