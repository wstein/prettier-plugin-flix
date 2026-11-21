---
title: Block comment on a match-lambda arrow inside a trailing lambda
description: "An end-of-line block comment after match-lambda -> keeps its break when the trailing lambda hugs the call."
group: "Pipelines and calls"
flix: "0.80"
options: { printWidth: 80 }
---

## Input

```flix
def f(l: List[Int32]): List[Int32] =
    l |> List.map(match x -> /* c */
    {
        x + 1
    })
```

## Output

```flix
def f(l: List[Int32]): List[Int32] =
    l
        |> List.map(match x -> /* c */
        {
            x + 1
        })
```
