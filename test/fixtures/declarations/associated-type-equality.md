---
title: "Constrain an associated type with where"
group: "Types and constraints"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Dec.AssocType.flix#L23"
---

## Input

```flix
pub def hasAGeneric(s: a): Bool with Coll[a] where Coll.Elem[a] ~ Char = Coll.contains('A', s)
```

## Output

```flix
pub def hasAGeneric(s: a): Bool with Coll[a] where Coll.Elem[a] ~ Char =
    Coll.contains('A', s)
```
