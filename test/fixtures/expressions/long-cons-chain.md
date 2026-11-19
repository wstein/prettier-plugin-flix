---
title: A long list constructor chain wraps at the requested width
description: "The Prettier width setting wraps the :: chain. The Flix 0.80 reference leaves the chain on a single line."
flix: "0.80"
flixFormat: "0.80.0"
options: { printWidth: 60 }
---

## Input

```flix
def chain(veryLongFirstElement: Int32, veryLongSecondElement: Int32, veryLongThirdElement: Int32): List[Int32] = veryLongFirstElement :: veryLongSecondElement :: veryLongThirdElement :: Nil
```

## Output

```flix
def chain(
    veryLongFirstElement: Int32,
    veryLongSecondElement: Int32,
    veryLongThirdElement: Int32
): List[Int32] =
    veryLongFirstElement ::
        veryLongSecondElement ::
        veryLongThirdElement ::
        Nil
```

## Flix Format

```flix
def chain(veryLongFirstElement: Int32, veryLongSecondElement: Int32, veryLongThirdElement: Int32): List[Int32] = veryLongFirstElement :: veryLongSecondElement :: veryLongThirdElement :: Nil
```
