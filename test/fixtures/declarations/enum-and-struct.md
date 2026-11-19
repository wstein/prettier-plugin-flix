---
title: Enum cases and struct fields
flix: "0.80"
---

## Input

```flix
enum Shape with Eq{case Circle(Float64),case Square(Float64)}
struct Point{x:Float64,y:Float64}
```

## Output

```flix
enum Shape with Eq { case Circle(Float64), case Square(Float64) }
struct Point { x: Float64, y: Float64 }
```
