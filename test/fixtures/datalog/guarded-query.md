---
title: "Format guards, negation, and a query"
description: "The rule has a positive atom, a negated atom, and a guard. The query projects the resulting values."
flix: "0.80"
---

## Input

```flix
pub def allowed(): Vector[Int32] = {
let program=#{Candidate(1). Candidate(2). Blocked(2). Allowed(x):-Candidate(x),not Blocked(x),if(x>0). };
query program select x from Allowed(x)
}
```

## Output

```flix
pub def allowed(): Vector[Int32] = {
    let program = #{
        Candidate(1).
        Candidate(2).
        Blocked(2).
        Allowed(x) :- Candidate(x), not Blocked(x), if (x > 0).
    };
    query program select x from Allowed(x)
}
```
