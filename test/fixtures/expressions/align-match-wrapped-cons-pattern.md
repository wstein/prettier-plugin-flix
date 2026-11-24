---
title: "Align match arms with wrapped list cons"
description: "When list cons wraps in a match arm, the other arms keep a single space before the arrow."
group: "Operators"
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
        {
            x
        }
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
        {
            x
        }
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
