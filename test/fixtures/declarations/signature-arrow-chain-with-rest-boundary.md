---
title: "Arrow chain and the with list fill the continuation line up to the print width"
description: "A return type arrow chain moves to its own line with a following `with` list when the list and the trailing `=` fit in the print width, and wraps at each arrow when they exceed it by one column."
group: "Types and constraints"
flix: "0.80"
options: { printWidth: 41 }
---

## Input

```flix
pub def lift2(_f: t1 -> t2 -> t): String -> String -> String with Order[t1], Order[t2], Order[t] = _ -> _ -> ""
```

## Output

```flix
pub def lift2(_f: t1 -> t2 -> t):
    String -> String -> String
    with Order[t1], Order[t2], Order[t] =
    _ -> _ -> ""
```

```flix printWidth=40
pub def lift2(_f: t1 -> t2 -> t):
    String -> String -> String with
        Order[t1],
        Order[t2],
        Order[t] = _ -> _ -> ""
```
