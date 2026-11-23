---
title: "Arrow chain and the next word share the line up to the print width"
description: "A return type arrow chain on its own continuation line keeps the first word of the `with` list on its line when the chain and the word fill the print width, and wraps at each arrow when they exceed it by one column."
group: "Types and constraints"
options: { printWidth: 80 }
---

## Input

```flix
pub def edge16(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[String] -> Vector[String] -> Vector[String] -> Vxxxxxxxxxxxxxxxx with Order[t1], Order[t10], Order[t11], Order[t12], Order[t13], Order[t14], Order[t15] =
    _ -> _ -> _ -> Vector.empty()

pub def edge17(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[String] -> Vector[String] -> Vector[String] -> Vxxxxxxxxxxxxxxxxx with Order[t1], Order[t10], Order[t11], Order[t12], Order[t13], Order[t14], Order[t15] =
    _ -> _ -> _ -> Vector.empty()
```

## Output

```flix
pub def edge16(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t):
    Vector[String] -> Vector[String] -> Vector[String] -> Vxxxxxxxxxxxxxxxx with
        Order[t1],
        Order[t10],
        Order[t11],
        Order[t12],
        Order[t13],
        Order[t14],
        Order[t15] = _ -> _ -> _ -> Vector.empty()

pub def edge17(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[String] ->
    Vector[String] ->
    Vector[String] ->
        Vxxxxxxxxxxxxxxxxx with
        Order[t1],
        Order[t10],
        Order[t11],
        Order[t12],
        Order[t13],
        Order[t14],
        Order[t15] = _ -> _ -> _ -> Vector.empty()
```
