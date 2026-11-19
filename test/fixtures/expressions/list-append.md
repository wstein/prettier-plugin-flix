---
title: Append lists with a triple colon
description: The example combines list construction with list concatenation and shows where a narrow layout can break.
flix: "0.80"
options: { printWidth: 80 }
---

## Input

```flix
pub def concatenate():List[Int32]=(1::2::Nil):::(3::4::Nil):::Nil
```

## Output

```flix
pub def concatenate(): List[Int32] = (1 :: 2 :: Nil) ::: (3 :: 4 :: Nil) ::: Nil
```

```flix printWidth=28
pub def concatenate():
    List[Int32] =
    (1 :: 2 :: Nil) :::
        (3 :: 4 :: Nil) :::
        Nil
```
