---
title: "Solve and query with provenance"
description: "The fixture covers psolve and pquery, including the with clause that selects provenance predicates."
flix: "0.80"
---

## Input

```flix
@Test
def testProvenance():Unit \ Assert={
let db=#{A(1). B(1). R(x):-A(x),B(x). };
let model=psolve db;
let result=pquery model select R(1) with {A,B};
Assert.assertEq(expected=2,Vector.length(result))
}
```

## Output

```flix
@Test
def testProvenance(): Unit \ Assert = {
    let db = #{ A(1). B(1). R(x) :- A(x), B(x). };
    let model = psolve db;
    let result = pquery model select R(1) with { A, B };
    Assert.assertEq(expected = 2, Vector.length(result))
}
```
