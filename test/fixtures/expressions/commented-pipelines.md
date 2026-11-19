---
title: Keep pipelines compact after a comment
description: A comment above a pipeline stays on its own line. The pipeline breaks only when its code needs the extra space.
flix: "0.80"
options: { printWidth: 80 }
---

## Input

```flix
def handleAmb(n: Int32): Int32 = n
def handleExc(n: Int32): Int32 = n

def main(): Unit \ IO = {
    // Apply the exception handler first.
    handleAmb(handleExc(42)) |> println;

    // Apply the ambiguity handler first.
    handleExc(handleAmb(42)) |> println
}
```

## Output

```flix
def handleAmb(n: Int32): Int32 = n
def handleExc(n: Int32): Int32 = n

def main(): Unit \ IO = {
    // Apply the exception handler first.
    handleAmb(handleExc(42)) |> println;

    // Apply the ambiguity handler first.
    handleExc(handleAmb(42)) |> println
}
```

```flix printWidth=35
def handleAmb(n: Int32): Int32 = n
def handleExc(n: Int32): Int32 = n

def main(): Unit \ IO = {
    // Apply the exception handler first.
    handleAmb(handleExc(42))
        |> println;

    // Apply the ambiguity handler first.
    handleExc(handleAmb(42))
        |> println
}
```
