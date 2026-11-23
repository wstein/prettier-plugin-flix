---
title: "Block comment in a trailing-lambda match pattern"
description: "A block comment before the closing parenthesis of a long match pattern does not change whether the trailing lambda hugs its call across passes."
group: "Pipelines and calls"
---

## Input

```flix
def firstWithSize(channels: List[Admin]): Option[Int32] =
    channels
        |> List.mapWithIndex(i -> match Admin.Admin(_, _, _, _, size, _, _, _ /* note */ ) -> {
            (Ref.get(size) > 0, i)
        })
        |> List.findLeft(match (b, _) -> b)
```

## Output

```flix
def firstWithSize(channels: List[Admin]): Option[Int32] =
    channels
        |> List.mapWithIndex(
            i -> match Admin.Admin(_, _, _, _, size, _, _, _ /* note */) -> {
                (Ref.get(size) > 0, i)
            }
        )
        |> List.findLeft(match (b, _) -> b)
```

```flix printWidth=60
def firstWithSize(channels: List[Admin]): Option[Int32] =
    channels
        |> List.mapWithIndex(
            i -> match Admin.Admin(
                _,
                _,
                _,
                _,
                size,
                _,
                _,
                _ /* note */
            ) -> {
                (Ref.get(size) > 0, i)
            }
        )
        |> List.findLeft(match (b, _) -> b)
```

```flix printWidth=100
def firstWithSize(channels: List[Admin]): Option[Int32] =
    channels
        |> List.mapWithIndex(i -> match Admin.Admin(_, _, _, _, size, _, _, _ /* note */) -> {
            (Ref.get(size) > 0, i)
        })
        |> List.findLeft(match (b, _) -> b)
```
