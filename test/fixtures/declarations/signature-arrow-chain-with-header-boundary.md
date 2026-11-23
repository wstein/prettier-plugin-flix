---
title: "Arrow chain and a with list share the signature line up to the print width"
description: "A return type arrow chain without an effect set stays on the signature line when the chain and ` with` fit there."
group: "Types and constraints"
options: { printWidth: 50 }
---

## Input

```flix
pub def a3(x: Int32): Int32 -> Int32 -> Int32 with Order[aaaaaaaaaaaaaaaa], Order[bbbbbbbbbbbbbbbbbbb] = x -> y -> x
```

## Output

```flix
pub def a3(x: Int32): Int32 -> Int32 -> Int32 with
        Order[aaaaaaaaaaaaaaaa],
        Order[bbbbbbbbbbbbbbbbbbb] = x -> y -> x
```

```flix printWidth=60
pub def a3(x: Int32): Int32 -> Int32 -> Int32 with
        Order[aaaaaaaaaaaaaaaa],
        Order[bbbbbbbbbbbbbbbbbbb] = x -> y -> x
```
