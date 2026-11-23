---
title: "Foreach with an associated effect"
group: "Additional language constructs"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Dec.Assoc.Type.Eff.flix#L36"
---

## Input

```flix
pub def exec(x: Vector[a]): Unit \ Runner.E[a] =
    foreach(a <- x) Runner.exec(a)
```

## Output

```flix
pub def exec(x: Vector[a]): Unit \ Runner.E[a] = foreach (a <- x) Runner.exec(a)
```
