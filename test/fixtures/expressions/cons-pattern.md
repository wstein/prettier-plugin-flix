---
title: "Match a list constructor"
group: "Additional language constructs"
flix: "0.80"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Dec.AssocType.flix#L185"
---

## Input

```flix
pub def f(x: List[a]): Option[a] = match x {
    case Nil => None
    case hd :: _ => Some(hd)
}
```

## Output

```flix
pub def f(x: List[a]): Option[a] = match x {
    case Nil => None
    case hd :: _ => Some(hd)
}
```
