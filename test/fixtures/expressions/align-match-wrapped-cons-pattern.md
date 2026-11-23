---
title: "Align match arms when a tight cons pattern wraps"
description: "A tight cons pattern that does not fit in its arm prints spaced and broken, so the other arms keep a single space before the arrow."
group: "Operators"
flix: "0.80"
options: { printWidth: 24 }
---

## Input

```flix
def e2(l: List[Int32]): List[Int32] = match l {
    case x::rest => (if (x > 0) {
        x
    } else {
        0 - x
    })::firstValueOfList::secondValueOfList::thirdValueOfList::rest
    case Nil => Nil
}
```

## Output

```flix
def e2(l: List[Int32]):
    List[
        Int32
    ] = match l {
    case x
        :: rest => (if (
        x > 0
    )
        {x}
    else {
        0 - x
    })
        :: firstValueOfList
        :: secondValueOfList
        :: thirdValueOfList
        :: rest
    case Nil => Nil
}
```

```flix printWidth=23
def e2(l: List[Int32]):
    List[
        Int32
    ] = match l {
    case x
        :: rest => (if (
        x > 0
    )
        {x}
    else {
        0 - x
    })
        :: firstValueOfList
        :: secondValueOfList
        :: thirdValueOfList
        :: rest
    case Nil => Nil
}
```
