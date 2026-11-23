---
title: Let chain and match arms
description: "The let binding and the match cases are indented as separate parts of the function body."
---

## Input

```flix
def f(x: Option[Int32]): Int32 = {let y = 1;
match x {case Some(v) => v+y
case None => y}}
```

## Output

```flix
def f(x: Option[Int32]): Int32 = {
    let y = 1;
    match x {
        case Some(v) => v + y
        case None    => y
    }
}
```
