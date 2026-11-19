---
title: Align comments on a function signature and body
description: A trailing comment on the signature shares the column of the first commented lines in the function body when the whole group fits.
flix: "0.80"
group: "Line endings and comment placement"
source: "https://github.com/flix/flix.dev/blob/655c94385f09855e88b333e98577194cedf91ce7/src/lib/indexExamples.js#L60"
---

## Input

```flix
/// A pure function is annotated with `\ {}`.
def inc1(x: Int32): Int32 \ {} = x + 1

/// An impure function is annotated with `\ IO`.
def inc2(x: Int32): Int32 \ IO =
    println("x = ${x}");
    x + 1

def f(): Int32 \ IO =     // f is impure
    let r1 = inc1(123);   // pure
    let r2 = inc2(456);   // impure
    r1 + r2               // pure
```

## Output

```flix
/// A pure function is annotated with `\ {}`.
def inc1(x: Int32): Int32 \ {} = x + 1

/// An impure function is annotated with `\ IO`.
def inc2(x: Int32): Int32 \ IO =
    println("x = ${x}");
    x + 1

def f(): Int32 \ IO =    // f is impure
    let r1 = inc1(123);  // pure
    let r2 = inc2(456);  // impure
    r1 + r2              // pure
```

```flix printWidth=38
/// A pure function is annotated with `\ {}`.
def inc1(x: Int32): Int32 \ {} = x + 1

/// An impure function is annotated with `\ IO`.
def inc2(x: Int32): Int32 \ IO =
    println("x = ${x}");
    x + 1

def f(): Int32 \ IO =  // f is impure
    let r1 = inc1(123);  // pure
    let r2 = inc2(456);  // impure
    r1 + r2              // pure
```
