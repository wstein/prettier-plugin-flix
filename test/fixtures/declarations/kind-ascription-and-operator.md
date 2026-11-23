---
title: "Kind ascriptions and custom operator definitions"
group: "Types and constraints"
---

## Input

```flix
type alias T=(Int32:Type)
def <><(_x:Int32,_y:Int32):Float32=42f32
```

## Output

```flix
type alias T = (Int32: Type)
def <><(_x: Int32, _y: Int32): Float32 = 42f32
```
