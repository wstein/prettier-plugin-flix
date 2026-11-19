---
title: Let chain and match arms
flix: "0.80"
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
        case None => y
    }
}
```
