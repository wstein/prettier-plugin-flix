---
title: "Combine facts with recursive path rules"
description: "The base rule derives paths for direct edges. The recursive rule extends paths by one edge. The formatter keeps each rule terminator distinct."
flix: "0.80"
showcase: 1
---

## Input

```flix
pub def paths(): #{Edge(Int32, Int32), Path(Int32, Int32)} = {
let facts=#{Edge(1,2). Edge(2,3). };
let rules=#{Path(x,y):-Edge(x,y). Path(x,z):-Path(x,y),Edge(y,z). };
solve (facts <+> rules)
}
```

## Output

```flix
pub def paths(): #{ Edge(Int32, Int32), Path(Int32, Int32) } = {
    let facts = #{ Edge(1, 2). Edge(2, 3). };
    let rules = #{
        Path(x, y) :- Edge(x, y).
        Path(x, z) :- Path(x, y), Edge(y, z).
    };
    solve (facts <+> rules)
}
```
