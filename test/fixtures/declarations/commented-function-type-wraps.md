---
title: "Keep commented function-type wraps idempotent"
description: "A block comment before ), after a parameter, or after -> must not change arrow wraps between passes."
group: "Types and constraints"
options: { printWidth: 40 }
---

## Input

```flix
type alias Planner = (String -> Int32 /* note */) -> Bool -> Char

pub def apply(_f: t1 -> t2 -> t3 -> t /* note */): Int32 = 1

def higherOrder(): (Int32 -> Int32) -> /* note */ (String -> String) -> List[Int32] -> List[String] = f -> _g -> xs -> List.map(Int32.toString, List.map(f, xs))
```

## Output

```flix
type alias Planner =
    (String -> Int32 /* note */) ->
    Bool ->
        Char

pub def apply(
    _f: t1 -> t2 -> t3 -> t /* note */
): Int32 = 1

def higherOrder(): (
    Int32 -> Int32
) -> /* note */
    (String -> String) ->
    List[Int32] ->
        List[String] =
    f ->
        _g ->
            xs ->
                List.map(
                    Int32.toString,
                    List.map(f, xs)
                )
```

```flix printWidth=30
type alias Planner =
    (
        String ->
            Int32 /* note */
    ) -> Bool -> Char

pub def apply(
    _f: t1 ->
        t2 ->
        t3 ->
            t /* note */
): Int32 = 1

def higherOrder(): (
    Int32 -> Int32
) -> /* note */
    (String -> String) ->
    List[Int32] ->
        List[String] =
    f ->
        _g ->
            xs ->
                List.map(
                    Int32.toString,
                    List.map(
                        f,
                        xs
                    )
                )
```

```flix printWidth=100
type alias Planner = (String -> Int32 /* note */) -> Bool -> Char

pub def apply(_f: t1 -> t2 -> t3 -> t /* note */): Int32 = 1

def higherOrder(): (Int32 -> Int32) -> /* note */
    (String -> String) ->
    List[Int32] ->
        List[String] = f -> _g -> xs -> List.map(Int32.toString, List.map(f, xs))
```
