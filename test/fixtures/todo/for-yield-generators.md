---
title: Keep multiline for-yield generators readable
description: "Keep each monadic generator on its own line when combining them would wrap the short yield expression."
source: "https://github.com/flix/flix.dev/blob/655c94385f09855e88b333e98577194cedf91ce7/src/lib/indexExamples.js#L269"
flix: "0.80"
options:
  printWidth: 70
status: todo
issue: generator list and yield expression wrap independently
---

## Input

```flix
def itinerary(): Option[Int32] =
    forM (
        x <- Some(5);
        y <- Some(x + 8);
        z <- Some(y + 9)
    ) yield x + y + z
```

## Output

```flix
def itinerary(): Option[Int32] =
    forM (
        x <- Some(5);
        y <- Some(x + 8);
        z <- Some(y + 9)
    ) yield x + y + z
```
