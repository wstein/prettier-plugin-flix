---
title: "Keep a query stable after comments around a statement separator"
description: "A comment lifted from the semicolon stays above the query without forcing its clauses to wrap."
options: { printWidth: 60 }
issue: "https://github.com/wstein/prettier-plugin-flix/issues/211"
---

## Input

```flix
pub def allowed(): Vector[Int32] = {
let program=#{Candidate(1). Candidate(2). Blocked(2). Allowed(x):-Candidate(x),not Blocked(x),if(x>0). } // before the separator
; // after the separator

query program select x from Allowed( /* selected */ x)
}
```

## Output

```flix
pub def allowed(): Vector[Int32] = {
    let program = #{
        Candidate(1).
        Candidate(2).
        Blocked(2).
        Allowed(x) :-
            Candidate(x), not Blocked(x), if (x > 0).
    };  // before the separator
    // after the separator

    query program select x from Allowed(/* selected */ x)
}
```

```flix printWidth=100
pub def allowed(): Vector[Int32] = {
    let program = #{
        Candidate(1).
        Candidate(2).
        Blocked(2).
        Allowed(x) :- Candidate(x), not Blocked(x), if (x > 0).
    };  // before the separator
    // after the separator

    query program select x from Allowed(/* selected */ x)
}
```
