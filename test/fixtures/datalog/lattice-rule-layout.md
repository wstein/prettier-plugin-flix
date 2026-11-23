---
title: Wrap lattice rules between whole predicates
description: "A long rule wraps after the implication. The semicolon and both arguments of a short lattice predicate stay together."
source: "https://github.com/flix/book/blob/64d81bd6984ede06442ef7b63235092b9fe3c29c/src/lattice-semantics.md#L140"
---

## Input

```flix
def rules(): #{ LocalVar(String; Int32), AddStm(String, String, String) } = #{ LocalVar(r; sum(v1, v2)) :- AddStm(r, x, y), LocalVar(x; v1), LocalVar(y; v2). }
```

## Output

```flix
def rules(): #{ LocalVar(String; Int32), AddStm(String, String, String) } = #{
    LocalVar(r; sum(v1, v2)) :-
        AddStm(r, x, y), LocalVar(x; v1), LocalVar(y; v2).
}
```

```flix printWidth=50
def rules(): #{
    LocalVar(String; Int32),
    AddStm(String, String, String)
} = #{
    LocalVar(r; sum(v1, v2)) :-
        AddStm(r, x, y),
        LocalVar(x; v1),
        LocalVar(y; v2).
}
```
