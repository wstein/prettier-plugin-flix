---
title: A trailing multi-line lambda stays on the call line
flix: "0.80"
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
