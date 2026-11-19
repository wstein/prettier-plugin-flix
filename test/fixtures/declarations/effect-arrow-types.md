---
title: "Arrow types with effect intersection"
group: "Types and constraints"
flix: "0.80"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Assoc.Eff.Contravariance.flix#L35"
---

## Input

```flix
pub def count(f: a -> Bool \ ef & (~Network), m: SecSet[a]): Int32 = ???
```

## Output

```flix
pub def count(f: a -> Bool \ ef & (~Network), m: SecSet[a]): Int32 = ???
```
