---
title: Align operators in multiline pipelines
description: Keep compact pipelines on one line and align leading operators when the pipeline needs to wrap.
flix: "0.80"
source: "https://github.com/flix/book/blob/64d81bd6984ede06442ef7b63235092b9fe3c29c/src/mutable-collections.md#L36"
options: { printWidth: 80 }
---

## Input

```flix
def countSmallValues(values: List[Int32]): Int32 =
    values |> List.map(x -> x * 2) |> List.filter(x -> x < 4) |> List.length

def main(): Unit \ IO = region rc {
    let fruits = MutList.empty(rc) !> MutList.push("Apple") !> MutList.push("Pear") !> MutList.push("Mango");
    MutList.forEach(println, fruits)
}
```

## Output

```flix
def countSmallValues(values: List[Int32]): Int32 =
    values |> List.map(x -> x * 2) |> List.filter(x -> x < 4) |> List.length

def main(): Unit \ IO = region rc {
    let fruits =
        MutList.empty(rc)
            !> MutList.push("Apple")
            !> MutList.push("Pear")
            !> MutList.push("Mango");
    MutList.forEach(println, fruits)
}
```

```flix printWidth=45
def countSmallValues(
    values: List[Int32]
): Int32 =
    values
        |> List.map(x -> x * 2)
        |> List.filter(x -> x < 4)
        |> List.length

def main(): Unit \ IO = region rc {
    let fruits =
        MutList.empty(rc)
            !> MutList.push("Apple")
            !> MutList.push("Pear")
            !> MutList.push("Mango");
    MutList.forEach(println, fruits)
}
```
