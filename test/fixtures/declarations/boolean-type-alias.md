---
title: "Boolean operators in a type alias"
group: "Types and constraints"
flix: "0.80"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Dec.TypeAlias.flix#L164"
---

## Input

```flix
type alias If[cond: Bool, t: Bool, f: Bool] = (cond and t) or (not cond and f)
```

## Output

```flix
type alias If[cond: Bool, t: Bool, f: Bool] = (cond and t) or (not cond and f)
```
