---
title: "Preserve comments at Datalog query list keywords"
description: "An own-line comment stays before from, and a trailing comment on from keeps the predicate list below the keyword."
options: { printWidth: 60 }
---

## Input

```flix
def example(): Vector[Int32] =
    let a = #{ A(1). };
    let b = #{ B(1). };
    query a, b
        select x
        // Keep this before from.
        from // Keep this after from.
            A(x), B(x)
```

## Output

```flix
def example(): Vector[Int32] =
    let a = #{ A(1). };
    let b = #{ B(1). };
    query a, b
        select x
        // Keep this before from.
        from  // Keep this after from.
            A(x),
            B(x)
```

```flix printWidth=100
def example(): Vector[Int32] =
    let a = #{ A(1). };
    let b = #{ B(1). };
    query a, b
        select x
        // Keep this before from.
        from  // Keep this after from.
            A(x),
            B(x)
```
