---
title: Keep dependent for-yield generators readable
description: "Wrap between generators when the complete expression exceeds the line width. Keep a short yield expression together."
source: "https://github.com/flix/flix.dev/blob/655c94385f09855e88b333e98577194cedf91ce7/src/lib/indexExamples.js#L269"
---

## Input

```flix
def divide(x: Int32, y: Int32): Option[Int32] =
    if (y == 0) None else Some(x / y)

def f(): Option[Int32] =
    forM (
        x <- divide(5, 2);
        y <- divide(x, 8);
        z <- divide(9, y)
    ) yield x + y + z
```

## Output

```flix
def divide(x: Int32, y: Int32): Option[Int32] =
    if (y == 0) None else Some(x / y)

def f(): Option[Int32] =
    forM (
        x <- divide(5, 2);
        y <- divide(x, 8);
        z <- divide(9, y)
    ) yield x + y + z
```

```flix printWidth=100
def divide(x: Int32, y: Int32): Option[Int32] = if (y == 0) None else Some(x / y)

def f(): Option[Int32] =
    forM (x <- divide(5, 2); y <- divide(x, 8); z <- divide(9, y)) yield x + y + z
```
