---
title: "Align match arms in a trailing lambda the same way on every pass"
description: "A lambda that a pass moves next to its call measures its match arms at the same indentation as the lambda printed in place."
group: "Pipelines and calls"
flix: "0.80"
options: { printWidth: 110 }
---

## Input

```flix
def keep(test: Vector[BoolExp]): Vector[BoolExp] =
    test
        // Delete checks of the form `x[i] == x[i]`.
        |> Vector.filter(
            e -> match e {
                case BoolExp.Eq(RowLoad(lhs1, lhs2, _, _), RowLoad(rhs1, rhs2, _, _)) =>
                    (lhs1, lhs2) != (rhs1, rhs2)
                case _ => true
            }
        )
```

## Output

```flix
def keep(test: Vector[BoolExp]): Vector[BoolExp] =
    test
        // Delete checks of the form `x[i] == x[i]`.
        |> Vector.filter(e -> match e {
            case BoolExp.Eq(RowLoad(lhs1, lhs2, _, _), RowLoad(rhs1, rhs2, _, _)) =>
                (lhs1, lhs2) != (rhs1, rhs2)
            case _ => true
        })
```

```flix printWidth=100
def keep(test: Vector[BoolExp]): Vector[BoolExp] =
    test
        // Delete checks of the form `x[i] == x[i]`.
        |> Vector.filter(e -> match e {
            case BoolExp.Eq(RowLoad(lhs1, lhs2, _, _), RowLoad(rhs1, rhs2, _, _)) =>
                (lhs1, lhs2) != (rhs1, rhs2)
            case _ => true
        })
```
