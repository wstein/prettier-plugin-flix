---
title: "Inject facts from a Vector"
description: "An inject expression turns collection elements into unary facts. The query filters them with a where clause."
flix: "0.80"
---

## Input

```flix
pub def ages(): Vector[Int32] = {
let facts=inject Vector#{18,25,40} into Age/1;
query facts select a from Age(a) where a>18
}
```

## Output

```flix
pub def ages(): Vector[Int32] = {
    let facts = inject Vector#{18, 25, 40} into Age/1;
    query facts select a from Age(a) where a > 18
}
```
