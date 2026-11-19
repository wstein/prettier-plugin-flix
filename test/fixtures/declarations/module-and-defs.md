---
title: Module with defs, one per line
flix: "0.80"
---

## Input

```flix
mod M{pub def add(x:Int32,y:Int32):Int32=x+y
def id(x:a):a=x}
```

## Output

```flix
mod M {
    pub def add(x: Int32, y: Int32): Int32 = x + y
    def id(x: a): a = x
}
```
