---
title: "A single return type arrow keeps the ordinary signature wrap"
description: "A return type with one arrow does not move to its own continuation line; it wraps as it does without the arrow chain rule."
group: "Types and constraints"
options: { printWidth: 80 }
---

## Input

```flix
pub def lift1X2(_f: t1 -> t2 -> t): String -> String with Order[t1], Order[t2], Order[t] =
    _ -> ""

pub def lift2X1(_f: t1 -> t2 -> t3 -> t): Vector[String] -> Vector[String] with Order[t1], Order[t2], Order[t3], Order[t4] =
    _ -> Vector.empty()

pub def effectOnly(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[String] -> Vector[String] \ (ef - Logger) + Fs.FileWrite + Abort + Net.Http =
    _ -> Vector.empty()

pub def paren1(_f: t1 -> t2 -> t): (String -> String) -> String with Order[t1], Order[t2], Order[t] =
    _ -> ""

pub def paren2(_f: t1 -> t2 -> t): String -> (String -> String) with Order[t1], Order[t2], Order[t] =
    _ -> _ -> ""

pub def paren3(_f: t1 -> t2 -> t): (String -> String, String -> String) -> String with Order[t1], Order[t2], Order[t] =
    _ -> ""
pub def rec1(_f: t1 -> t2 -> t): {f = String -> String} -> String with Order[t1], Order[t2], Order[t] =
    _ -> ""

pub def rec2(_f: t1 -> t2 -> t): String -> {f = String -> String, g = Int32} with Order[t1], Order[t2], Order[t] =
    _ -> {f = _ -> "", g = 1}
```

## Output

```flix
pub def lift1X2(_f: t1 -> t2 -> t): String -> String
    with Order[t1], Order[t2], Order[t] = _ -> ""

pub def lift2X1(_f: t1 -> t2 -> t3 -> t): Vector[String] -> Vector[String]
    with Order[t1], Order[t2], Order[t3], Order[t4] = _ -> Vector.empty()

pub def effectOnly(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[String] ->
        Vector[String] \ (ef - Logger) + Fs.FileWrite + Abort + Net.Http =
    _ -> Vector.empty()

pub def paren1(_f: t1 -> t2 -> t): (String -> String) -> String
    with Order[t1], Order[t2], Order[t] = _ -> ""

pub def paren2(_f: t1 -> t2 -> t): String -> (String -> String)
    with Order[t1], Order[t2], Order[t] = _ -> _ -> ""

pub def paren3(_f: t1 -> t2 -> t): (String -> String, String -> String) ->
        String with Order[t1], Order[t2], Order[t] = _ -> ""
pub def rec1(_f: t1 -> t2 -> t): {f = String -> String} -> String
    with Order[t1], Order[t2], Order[t] = _ -> ""

pub def rec2(_f: t1 -> t2 -> t): String -> {f = String -> String, g = Int32}
    with Order[t1], Order[t2], Order[t] = _ -> {f = _ -> "", g = 1}
```

```flix printWidth=60
pub def lift1X2(_f: t1 -> t2 -> t): String -> String
    with Order[t1], Order[t2], Order[t] = _ -> ""

pub def lift2X1(_f: t1 -> t2 -> t3 -> t): Vector[String] ->
        Vector[String] with
        Order[t1],
        Order[t2],
        Order[t3],
        Order[t4] = _ -> Vector.empty()

pub def effectOnly(
    _f: t1 -> t2 -> t3 -> t4 -> t5 -> t
): Vector[String] -> Vector[String] \ (
    ef - Logger
) + Fs.FileWrite + Abort + Net.Http = _ -> Vector.empty()

pub def paren1(_f: t1 -> t2 -> t): (String -> String) ->
        String with Order[t1], Order[t2], Order[t] = _ -> ""

pub def paren2(_f: t1 -> t2 -> t): String ->
        (String -> String) with
        Order[t1],
        Order[t2],
        Order[t] = _ -> _ -> ""

pub def paren3(_f: t1 -> t2 -> t): (
    String -> String,
    String -> String
) -> String with Order[t1], Order[t2], Order[t] = _ -> ""
pub def rec1(_f: t1 -> t2 -> t): {f = String -> String} ->
        String with Order[t1], Order[t2], Order[t] = _ -> ""

pub def rec2(_f: t1 -> t2 -> t): String ->
        {f = String -> String, g = Int32} with
        Order[t1],
        Order[t2],
        Order[t] = _ -> {f = _ -> "", g = 1}
```

```flix printWidth=100
pub def lift1X2(_f: t1 -> t2 -> t): String -> String with Order[t1], Order[t2], Order[t] = _ -> ""

pub def lift2X1(_f: t1 -> t2 -> t3 -> t): Vector[String] -> Vector[String]
    with Order[t1], Order[t2], Order[t3], Order[t4] = _ -> Vector.empty()

pub def effectOnly(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[String] -> Vector[String]
    \ (ef - Logger) + Fs.FileWrite + Abort + Net.Http = _ -> Vector.empty()

pub def paren1(_f: t1 -> t2 -> t): (String -> String) -> String
    with Order[t1], Order[t2], Order[t] = _ -> ""

pub def paren2(_f: t1 -> t2 -> t): String -> (String -> String)
    with Order[t1], Order[t2], Order[t] = _ -> _ -> ""

pub def paren3(_f: t1 -> t2 -> t): (String -> String, String -> String) -> String
    with Order[t1], Order[t2], Order[t] = _ -> ""
pub def rec1(_f: t1 -> t2 -> t): {f = String -> String} -> String
    with Order[t1], Order[t2], Order[t] = _ -> ""

pub def rec2(_f: t1 -> t2 -> t): String -> {f = String -> String, g = Int32}
    with Order[t1], Order[t2], Order[t] = _ -> {f = _ -> "", g = 1}
```
