---
title: "Preserve blank lines between declarations"
description: "Keep declarations together where the source has no gap, and reduce consecutive blank lines to one."
flix: "0.80"
---

## Input

```flix
import java.lang.StringBuilder
use List.append
mod Steps {
    def first(): Int32 = 1
    def second(): Int32 = 2
    // This comment describes the block-bodied declaration.
    def sum(): Int32 = { first() + second() }

    def third(): Int32 = 3
    def fourth(): Int32 = 4
}
enum Status { case Ready }

struct Count { value: Int32 }



def ready(): Status = Status.Ready
def zero(): Int32 = 0
```

## Output

```flix
import java.lang.StringBuilder
use List.append
mod Steps {
    def first(): Int32 = 1
    def second(): Int32 = 2
    // This comment describes the block-bodied declaration.
    def sum(): Int32 = { first() + second() }

    def third(): Int32 = 3
    def fourth(): Int32 = 4
}
enum Status { case Ready }

struct Count { value: Int32 }

def ready(): Status = Status.Ready
def zero(): Int32 = 0
```
