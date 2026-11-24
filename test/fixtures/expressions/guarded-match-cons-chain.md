---
title: Wrap a cons chain in a match guard deeper than the arm body
description: "A cons chain that opens a guard wraps with the same continuation indent as other guard operators. A cons chain nested inside a guard expression does not take that deeper indent."
group: "Operators"
options: { printWidth: 40 }
---

## Input

```flix
def f(xs: List[Int32], ys: List[Int32]): Int32 = match xs {
    case x :: _ if x :: firstValueOfList :: secondValueOfList :: thirdValueOfList == ys => 1
    case x :: _ if x > 0 and (firstValueOfList :: secondValueOfList :: thirdValueOfList) == ys => 2
    case _ => 0
}
```

## Output

```flix
def f(
    xs: List[Int32],
    ys: List[Int32]
): Int32 = match xs {
    case x :: _ if x
            :: firstValueOfList
            :: secondValueOfList
            :: thirdValueOfList
            == ys => 1
    case x :: _ if x > 0
            and (
                firstValueOfList
                    :: secondValueOfList
                    :: thirdValueOfList
            )
                == ys => 2
    case _ => 0
}
```

```flix printWidth=100
def f(xs: List[Int32], ys: List[Int32]): Int32 = match xs {
    case x :: _ if x :: firstValueOfList :: secondValueOfList :: thirdValueOfList == ys        => 1
    case x :: _ if x > 0 and (firstValueOfList :: secondValueOfList :: thirdValueOfList) == ys => 2
    case _                                                                                     => 0
}
```
