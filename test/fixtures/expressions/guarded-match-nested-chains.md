---
title: Nested chains inside a match guard keep the normal continuation indent
description: "A binary chain in a call argument, lambda body or parenthesized operand of a guard wraps at +4 from its own line, not the guard's deeper +8. The guard's own top-level chain still uses +8. A guarded match nested inside a guard restores the outer guard start."
group: "Operators"
options: { printWidth: 60 }
---

## Input

```flix
def f(x: Int32, stationOpen: Bool, lastConnectionAvailable: Bool, ys: List[Int32]): Int32 = match x {
    case 1 if stationOpen and lastConnectionAvailable and someVeryLongArgumentNameHere => 1
    case 2 if checkTheRoute(stationOpen and lastConnectionAvailable and someVeryLongArgumentNameHere, anotherLongArgumentName) => 2
    case 3 if List.exists(y -> y + someLongConstantValueName + anotherLongConstantValueName > 100000, ys) => 3
    case 4 if (stationOpen and lastConnectionAvailable and someVeryLongArgumentNameHere) => 4
    case 5 if (match x { case 6 if stationOpen => true case _ => false }) and lastConnectionAvailable and stationOpen => 5
    case _ => 0
}
```

## Output

```flix
def f(
    x: Int32,
    stationOpen: Bool,
    lastConnectionAvailable: Bool,
    ys: List[Int32]
): Int32 = match x {
    case 1 if stationOpen and
            lastConnectionAvailable and
            someVeryLongArgumentNameHere => 1
    case 2 if checkTheRoute(
        stationOpen and
            lastConnectionAvailable and
            someVeryLongArgumentNameHere,
        anotherLongArgumentName
    ) => 2
    case 3 if List.exists(
        y ->
            y +
                someLongConstantValueName +
                anotherLongConstantValueName >
                100000,
        ys
    ) => 3
    case 4 if (
        stationOpen and
            lastConnectionAvailable and
            someVeryLongArgumentNameHere
    ) => 4
    case 5 if (match x {
        case 6 if stationOpen => true
        case _                => false
    }) and
            lastConnectionAvailable and
            stationOpen => 5
    case _ => 0
}
```
