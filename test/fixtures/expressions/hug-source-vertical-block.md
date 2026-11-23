---
title: "Keep source-vertical blocks inside a hugged trailing lambda"
description: "A single-statement block that the source wrote on several lines stays vertical when its trailing lambda hugs the call."
group: "Pipelines and calls"
options: { printWidth: 100 }
---

## Input

```flix
def increment(l: List[Int32]): List[Int32] =
    l |> List.map(x -> {
        x + 1
    })

def sign(l: List[Int32]): List[Int32] =
    l |> List.map(x -> match x {
        case 0 => 0
        case _ => if (x > 1) {
            1
        } else {
            -1
        }
    })

def compact(l: List[Int32]): List[Int32] =
    l |> List.map(x -> { x + 1 })

def group(f: (a, a) -> Bool, l: List[a]): List[a] =
    (Nil, l)
        ||> List.foldLeft(
            acc -> value -> {
                groupWithHelper(value, f, acc)
            }
        )

def firstWithSize(channels: List[Admin]): Option[Int32] =
    channels
        |> List.mapWithIndex(
            i -> match Admin.Admin(_, _, _, _, size, _, _, _) -> {
                (Ref.get(size) > 0, i)
            }
        )
        |> List.findLeft(match (b, _) -> b)
```

## Output

```flix
def increment(l: List[Int32]): List[Int32] =
    l
        |> List.map(x -> {
            x + 1
        })

def sign(l: List[Int32]): List[Int32] =
    l
        |> List.map(x -> match x {
            case 0 => 0
            case _ => if (x > 1) {
                1
            } else {
                -1
            }
        })

def compact(l: List[Int32]): List[Int32] = l |> List.map(x -> { x + 1 })

def group(f: (a, a) -> Bool, l: List[a]): List[a] =
    (Nil, l) ||>
        List.foldLeft(acc -> value -> {
            groupWithHelper(value, f, acc)
        })

def firstWithSize(channels: List[Admin]): Option[Int32] =
    channels
        |> List.mapWithIndex(i -> match Admin.Admin(_, _, _, _, size, _, _, _) -> {
            (Ref.get(size) > 0, i)
        })
        |> List.findLeft(match (b, _) -> b)
```

```flix printWidth=46
def increment(l: List[Int32]): List[Int32] =
    l
        |> List.map(x -> {
            x + 1
        })

def sign(l: List[Int32]): List[Int32] =
    l
        |> List.map(x -> match x {
            case 0 => 0
            case _ => if (x > 1) {
                1
            } else {
                -1
            }
        })

def compact(l: List[Int32]): List[Int32] =
    l |> List.map(x -> { x + 1 })

def group(f: (a, a) -> Bool, l: List[a]):
    List[a] =
    (Nil, l) ||>
        List.foldLeft(acc -> value -> {
            groupWithHelper(value, f, acc)
        })

def firstWithSize(channels: List[Admin]):
    Option[Int32] =
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
                _
            ) -> {
                (Ref.get(size) > 0, i)
            }
        )
        |> List.findLeft(match (b, _) -> b)
```

```flix printWidth=60
def increment(l: List[Int32]): List[Int32] =
    l
        |> List.map(x -> {
            x + 1
        })

def sign(l: List[Int32]): List[Int32] =
    l
        |> List.map(x -> match x {
            case 0 => 0
            case _ => if (x > 1) {
                1
            } else {
                -1
            }
        })

def compact(l: List[Int32]): List[Int32] =
    l |> List.map(x -> { x + 1 })

def group(f: (a, a) -> Bool, l: List[a]): List[a] =
    (Nil, l) ||>
        List.foldLeft(acc -> value -> {
            groupWithHelper(value, f, acc)
        })

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
                _
            ) -> {
                (Ref.get(size) > 0, i)
            }
        )
        |> List.findLeft(match (b, _) -> b)
```
