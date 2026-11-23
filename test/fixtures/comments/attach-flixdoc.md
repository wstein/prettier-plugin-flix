---
title: Attach Flixdoc to its declaration
description: "Remove blank lines between a Flixdoc block and the declaration or its annotations; keep one blank between separate declarations. Only exact `///` is Flixdoc; the last lead comment decides attachment."
group: "Line endings and comment placement"
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

/// Doc then a plain lead keeps the blank.
// plain

def mixedTail(): Int32 = 1

// plain then Flixdoc still attaches.
/// Doc after plain.


def mixedHead(): Int32 = 2

//// Four slashes are not Flixdoc.

def notDoc(): Int32 = 3
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

/// Doc then a plain lead keeps the blank.
// plain

def mixedTail(): Int32 = 1

// plain then Flixdoc still attaches.
/// Doc after plain.
def mixedHead(): Int32 = 2

//// Four slashes are not Flixdoc.

def notDoc(): Int32 = 3
```
