---
title: Block comment on a match-lambda arrow inside a trailing lambda
description: "An end-of-line block comment after a match-lambda arrow or a match scrutinee keeps its break when the trailing lambda hugs the call."
group: "Pipelines and calls"
options: { printWidth: 80 }
---

## Input

```flix
def f(l: List[Int32]): List[Int32] =
    l |> List.mapWithIndex(i -> match y -> /* c */
    {
        i + y
    })

def g(l: List[Int32]): List[Int32] =
    l |> List.map(x -> match x /* c */
    {
        case 0 => 0
        case _ => x + 1
    })
```

## Output

```flix
def f(l: List[Int32]): List[Int32] =
    l
        |> List.mapWithIndex(i -> match y -> /* c */
        {
            i + y
        })

def g(l: List[Int32]): List[Int32] =
    l
        |> List.map(x -> match x /* c */
        {
            case 0 => 0
            case _ => x + 1
        })
```
