---
title: Wrap mixed operators in a match guard deeper than the arm body
description: "A guard with +, == or |> wraps with a deeper continuation indent than the body under =>. A wrapped body after a wrapped guard keeps the body indent. Compact when the whole guard fits."
flix: "0.80"
options: { printWidth: 75 }
---

## Input

```flix
def f(x: Bool, firstCondition: Int32, secondCondition: Int32, thirdCondition: Int32): Int32 = match x {
case _ if firstCondition + secondCondition + thirdCondition == 0 => 1
case true if firstCondition |> Int32.abs |> Int32.max(secondCondition) |> Int32.max(thirdCondition) > 9 => 2
case false if firstCondition + secondCondition + thirdCondition + firstCondition + secondCondition > 0 =>
firstCondition + secondCondition + thirdCondition + firstCondition + secondCondition + thirdCondition
case _ => 0
}
```

## Output

```flix
def f(
    x: Bool,
    firstCondition: Int32,
    secondCondition: Int32,
    thirdCondition: Int32
): Int32 = match x {
    case _ if firstCondition + secondCondition + thirdCondition == 0 => 1
    case true if firstCondition
            |> Int32.abs
            |> Int32.max(secondCondition)
            |> Int32.max(thirdCondition) >
            9 => 2
    case false if firstCondition +
            secondCondition +
            thirdCondition +
            firstCondition +
            secondCondition >
            0 =>
        firstCondition +
            secondCondition +
            thirdCondition +
            firstCondition +
            secondCondition +
            thirdCondition
    case _ => 0
}
```

```flix printWidth=70
def f(
    x: Bool,
    firstCondition: Int32,
    secondCondition: Int32,
    thirdCondition: Int32
): Int32 = match x {
    case _ if firstCondition + secondCondition + thirdCondition ==
            0 => 1
    case true if firstCondition
            |> Int32.abs
            |> Int32.max(secondCondition)
            |> Int32.max(thirdCondition) >
            9 => 2
    case false if firstCondition +
            secondCondition +
            thirdCondition +
            firstCondition +
            secondCondition >
            0 =>
        firstCondition +
            secondCondition +
            thirdCondition +
            firstCondition +
            secondCondition +
            thirdCondition
    case _ => 0
}
```
