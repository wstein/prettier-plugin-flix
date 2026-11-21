---
title: Block comment in a hugged trailing-lambda match body
description: "An end-of-line block comment after => in a match arm keeps its line break when the trailing lambda hugs the call."
group: "Pipelines and calls"
flix: "0.80"
options: { printWidth: 80 }
---

## Input

```flix
def f(l: List[Int32]): List[Int32] =
    l |> List.map(x -> match x {
        case 0 => /* zero */
            0
        case _ => x + 1 /* other */
    })
```

## Output

```flix
def f(l: List[Int32]): List[Int32] =
    l
        |> List.map(x -> match x {
            case 0 => /* zero */
                0
            case _ => x + 1 /* other */
        })
```
