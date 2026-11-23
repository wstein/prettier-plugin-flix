---
title: "Align arrows in multiline match arms"
description: "Keep simple match arms in a common arrow column when the rows fit. A narrower line width uses regular spacing."
---

## Input

```flix
enum Shape { case Circle(Int32), case Square(Int32), case Rectangle(Int32, Int32) }

def area(s: Shape): Int32 = match s {
    case Shape.Circle(r) => 3 * (r * r)
    case Shape.Square(w) => w * w
    case Shape.Rectangle(h, w) => h * w
}
```

## Output

```flix
enum Shape {
    case Circle(Int32),
    case Square(Int32),
    case Rectangle(Int32, Int32)
}

def area(s: Shape): Int32 = match s {
    case Shape.Circle(r)       => 3 * (r * r)
    case Shape.Square(w)       => w * w
    case Shape.Rectangle(h, w) => h * w
}
```

```flix printWidth=44
enum Shape {
    case Circle(Int32),
    case Square(Int32),
    case Rectangle(Int32, Int32)
}

def area(s: Shape): Int32 = match s {
    case Shape.Circle(r) => 3 * (r * r)
    case Shape.Square(w) => w * w
    case Shape.Rectangle(h, w) => h * w
}
```
