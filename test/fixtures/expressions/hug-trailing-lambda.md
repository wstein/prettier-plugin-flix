---
title: A trailing multi-line lambda stays on the call line
description: "The call keeps the trailing lambda beside its other argument, even though the lambda body spans lines."
---

## Input

```flix
def f(): Unit = List.forEach(xs, x -> {
println(x);
println(x)
})
```

## Output

```flix
def f(): Unit = List.forEach(xs, x -> {
    println(x);
    println(x)
})
```
