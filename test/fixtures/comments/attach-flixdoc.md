---
title: Attach Flixdoc to its declaration
description: "Remove blank lines between a Flixdoc block and the declaration or its annotations; keep one blank between separate declarations."
group: "Line endings and comment placement"
flix: "0.80"
---

## Input

```flix
/// A pure function is annotated with `\ {}`.
def inc1(x: Int32): Int32 \ {} = x + 1

/// An impure function is annotated with `\ IO`.

def inc2(x: Int32): Int32 \ IO =
    println("x = ${x}");
    x + 1



/// Documented lazy value.


@Lazy
def lazyOne(): Int32 = 1

// A plain header may keep its blank line.

def plain(): Int32 = 0
```

## Output

```flix
/// A pure function is annotated with `\ {}`.
def inc1(x: Int32): Int32 \ {} = x + 1

/// An impure function is annotated with `\ IO`.
def inc2(x: Int32): Int32 \ IO =
    println("x = ${x}");
    x + 1

/// Documented lazy value.
@Lazy
def lazyOne(): Int32 = 1

// A plain header may keep its blank line.

def plain(): Int32 = 0
```
