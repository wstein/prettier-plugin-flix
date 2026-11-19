---
title: "Open an extensible variant"
group: "Additional language constructs"
flix: "0.80"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Def.ChooseStar.Simple.flix#L149"
---

## Input

```flix
@CompileTest
pub def testChooseStar10(): Bool = {
    let cstOrVar = if (true) open_variant Expr.Cst else open_variant Expr.Var;
    let thing = helper10(cstOrVar);
    choose thing {case Expr.Cst => true}
}
```

## Output

```flix
@CompileTest
pub def testChooseStar10(): Bool = {
    let cstOrVar = if (true) open_variant Expr.Cst else open_variant Expr.Var;
    let thing = helper10(cstOrVar);
    choose thing { case Expr.Cst => true }
}
```
