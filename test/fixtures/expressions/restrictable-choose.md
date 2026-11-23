---
title: "Choose over a restrictable enum"
group: "Additional language constructs"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Def.ChooseStar.Simple.flix#L97"
---

## Input

```flix
def helper05(e: Expr[s rvand <Expr.Not, Expr.Cst>]): Expr[(s rvand <Expr.Not>) rvadd <Expr.Var>] = choose* e {
    case Expr.Not => Expr.Not
    case Expr.Cst => Expr.Var
}
```

## Output

```flix
def helper05(e: Expr[s rvand <Expr.Not, Expr.Cst>]):
    Expr[(s rvand <Expr.Not>) rvadd <Expr.Var>] = choose* e {
    case Expr.Not => Expr.Not
    case Expr.Cst => Expr.Var
}
```
