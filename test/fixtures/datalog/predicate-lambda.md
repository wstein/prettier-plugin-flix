---
title: "Datalog predicate lambda"
group: "Predicate expressions"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Exp.Fixpoint.Lambda.flix#L117"
---

## Input

```flix
def poly(x: a): #{ R(String) } with Order[a] =
    #(R) -> #{
        A(x).
        R("OK") :- A(x).
    }
```

## Output

```flix
def poly(x: a): #{ R(String) } with Order[a] =
    #(R) -> #{
        A(x).
        R("OK") :- A(x).
    }
```
