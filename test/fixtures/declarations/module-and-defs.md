---
title: Module with defs, one per line
description: "Each definition gets its own line inside the module, with consistent spacing around parameters and types."
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
