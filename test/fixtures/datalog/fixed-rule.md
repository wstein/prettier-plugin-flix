---
title: "Keep fix attached to its predicate"
description: "The fix modifier belongs to the body atom and stays separate from the adjacent negated atom."
---

## Input

```flix
pub def fixed():Vector[Int32]={
let pr=#{A(1). A(2). B(3). B(x):-A(x). C(x):-fix B(x),not A(x). };
let mm=solve pr;
query mm select (x) from C(x)
}
```

## Output

```flix
pub def fixed(): Vector[Int32] = {
    let pr = #{ A(1). A(2). B(3). B(x) :- A(x). C(x) :- fix B(x), not A(x). };
    let mm = solve pr;
    query mm select (x) from C(x)
}
```
