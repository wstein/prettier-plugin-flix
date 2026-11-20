---
title: "Blank lines around declaration blocks"
description: "Separate sibling declarations with braced bodies and keep compact declarations together."
flix: "0.80"
---

## Input

```flix
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
