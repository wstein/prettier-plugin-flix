---
title: "Separate a wrapped with list from a wrapped function return type"
description: "A fitting arrow return stays on one line above a fitting with list. A wrapped constraint list uses one indent from the declaration even when the result type wraps."
group: "Types and constraints"
options: { printWidth: 80 }
---

## Input

```flix
pub def lift5(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): String -> String -> String -> String -> String -> String with Order[t1], Order[t2], Order[t3], Order[t4], Order[t5], Order[t] =
    _ -> _ -> _ -> _ -> _ -> ""
```

## Output

```flix
pub def lift5(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t):
    String -> String -> String -> String -> String -> String
    with Order[t1], Order[t2], Order[t3], Order[t4], Order[t5], Order[t] =
    _ -> _ -> _ -> _ -> _ -> ""
```

```flix printWidth=100
pub def lift5(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t):
    String -> String -> String -> String -> String -> String
    with Order[t1], Order[t2], Order[t3], Order[t4], Order[t5], Order[t] =
    _ -> _ -> _ -> _ -> _ -> ""
```

```flix printWidth=60
pub def lift5(
    _f: t1 -> t2 -> t3 -> t4 -> t5 -> t
): String ->
    String ->
    String ->
    String ->
    String ->
        String with
    Order[t1],
    Order[t2],
    Order[t3],
    Order[t4],
    Order[t5],
    Order[t] = _ -> _ -> _ -> _ -> _ -> ""
```

```flix printWidth=70
pub def lift5(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t):
    String -> String -> String -> String -> String -> String with
    Order[t1],
    Order[t2],
    Order[t3],
    Order[t4],
    Order[t5],
    Order[t] = _ -> _ -> _ -> _ -> _ -> ""
```

```flix printWidth=120
pub def lift5(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): String -> String -> String -> String -> String -> String
    with Order[t1], Order[t2], Order[t3], Order[t4], Order[t5], Order[t] = _ -> _ -> _ -> _ -> _ -> ""
```
