---
title: A module-level value uses declaration wrapping
flix: "0.80"
---

## Input

```flix
val answer:Int32=42
```

## Output

```flix
val answer: Int32 = 42
```

```flix printWidth=20
val answer: Int32 =
    42
```
