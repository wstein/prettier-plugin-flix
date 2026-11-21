---
title: Keep an own-line comment between if and a match guard
description: "An own-line comment after `if` stays on its own line across passes; the guard is not marked as a line start."
group: "Line endings and comment placement"
flix: "0.80"
options: { printWidth: 80 }
---

## Input

```flix
def f(x: Int32, stationOpen: Bool, b: Bool): Int32 = match x {
    case 1 if
    // own
    stationOpen and b => 1
    case _ => 0
}
```

## Output

```flix
def f(x: Int32, stationOpen: Bool, b: Bool): Int32 = match x {
    case 1 if
    // own
    stationOpen and b => 1
    case _ => 0
}
```

```flix printWidth=40
def f(
    x: Int32,
    stationOpen: Bool,
    b: Bool
): Int32 = match x {
    case 1 if
    // own
    stationOpen and b => 1
    case _ => 0
}
```
