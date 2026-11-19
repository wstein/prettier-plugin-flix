---
title: Align type comments on adjacent code lines
description: The comments describe the list type before and after mapping. The second comment starts one column early and joins the first comment at 80 columns. At 72 columns both comments fit with ordinary spacing.
flix: "0.80"
group: "Line endings and comment placement"
source: "https://github.com/flix/book/blob/64d81bd6984ede06442ef7b63235092b9fe3c29c/src/tuples.md#L35"
options: { printWidth: 80 }
---

## Input

```flix
def firstElements(): List[Int32] = {
    let l = (1, 1) :: (2, 2) :: Nil;  // has type List[(Int32, Int32)]
    List.map(fst, l)                 // has type List[Int32], one per tuple
}
```

## Output

```flix
def firstElements(): List[Int32] = {
    let l = (1, 1) :: (2, 2) :: Nil;  // has type List[(Int32, Int32)]
    List.map(fst, l)                  // has type List[Int32], one per tuple
}
```

```flix printWidth=72
def firstElements(): List[Int32] = {
    let l = (1, 1) :: (2, 2) :: Nil;  // has type List[(Int32, Int32)]
    List.map(fst, l)  // has type List[Int32], one per tuple
}
```
