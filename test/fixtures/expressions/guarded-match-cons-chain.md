---
title: Wrap a cons chain in a match guard deeper than the arm body
description: "A cons chain that opens a guard wraps with the same continuation indent as other guard operators."
group: "Operators"
flix: "0.80"
options: { printWidth: 40 }
---

## Input

```flix
def f(xs: List[Int32], ys: List[Int32]): Int32 = match xs {
    case x :: _ if x :: firstValueOfList :: secondValueOfList :: thirdValueOfList == ys => 1
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
            :: thirdValueOfList ==
            ys => 1
    case _ => 0
}
```

```flix printWidth=100
def f(xs: List[Int32], ys: List[Int32]): Int32 = match xs {
    case x :: _ if x :: firstValueOfList :: secondValueOfList :: thirdValueOfList == ys => 1
    case _                                                                              => 0
}
```
