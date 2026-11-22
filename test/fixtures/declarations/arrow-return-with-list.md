---
title: "Separate a wrapped with list from a wrapped function return type"
description: "When both the arrow return and the with list wrap, the deeper with-list indent keeps constraints below the arrow parameters."
group: "Types and constraints"
flix: "0.80"
options: { printWidth: 80 }
---

## Input

```flix
pub def lift5(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): String -> String -> String -> String -> String -> String with Order[t1], Order[t2], Order[t3], Order[t4], Order[t5], Order[t] =
    _ -> _ -> _ -> _ -> _ -> ""
```

## Output

```flix
pub def lift5(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): String ->
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

```flix printWidth=100
pub def lift5(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): String ->
    String ->
    String ->
    String ->
    String ->
        String with Order[t1], Order[t2], Order[t3], Order[t4], Order[t5], Order[t] =
    _ -> _ -> _ -> _ -> _ -> ""
```
