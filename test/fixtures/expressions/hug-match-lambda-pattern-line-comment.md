---
title: Line comment after a nested match-lambda pattern in a trailing lambda
description: "A line comment after the pattern of a match lambda keeps the arrow on the next line when the trailing lambda hugs the call."
group: "Pipelines and calls"
options: { printWidth: 80 }
---

## Input

```flix
def f(l: List[Int32]): List[Int32] =
    l |> List.mapWithIndex(i -> match y // c
    -> {
        i + y
    })
```

## Output

```flix
def f(l: List[Int32]): List[Int32] =
    l
        |> List.mapWithIndex(i -> match y  // c
        -> {
            i + y
        })
```
