---
title: "Keep an own-line comment inside an operand of a wrapped cons chain"
description: "A tight cons chain that prints spaced keeps the comments inside its operands."
group: "Operators"
options: { printWidth: 100 }
---

## Input

```flix
def fs(): List[Int32 -> Int32] = (x -> {
    let y = x + 1;
    y * 2
})::(firstIncrementFunction
// own
)::(secondIncrementFunction)::(thirdIncrementFunction)::Nil
```

## Output

```flix
def fs(): List[Int32 -> Int32] = (x -> {
    let y = x + 1;
    y * 2
})
    :: (
        firstIncrementFunction
        // own
    )
    :: (secondIncrementFunction)
    :: (thirdIncrementFunction)
    :: Nil
```

```flix printWidth=40
def fs(): List[Int32 -> Int32] = (x -> {
    let y = x + 1;
    y * 2
})
    :: (
        firstIncrementFunction
        // own
    )
    :: (secondIncrementFunction)
    :: (thirdIncrementFunction)
    :: Nil
```
