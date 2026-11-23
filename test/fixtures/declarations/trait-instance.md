---
title: "Trait and instance with an associated type"
description: "Compare the indentation of trait signatures, associated types, and their instance implementations."
---

## Input

```flix
trait Convert[a]{
type Result[a]:Type
pub def convert(x:a):Convert.Result[a]
}
instance Convert[Int32]{
type Result[Int32]=Int32
pub def convert(x:Int32):Int32=x+1
}
```

## Output

```flix
trait Convert[a] {
    type Result[a]: Type
    pub def convert(x: a): Convert.Result[a]
}
instance Convert[Int32] {
    type Result[Int32] = Int32
    pub def convert(x: Int32): Int32 = x + 1
}
```
