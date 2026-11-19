---
title: A module-level value uses declaration wrapping
description: "This checks a module-level val declaration at both the default width and a narrower width."
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
