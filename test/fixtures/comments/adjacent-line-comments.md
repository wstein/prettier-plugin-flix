---
title: Line comments on neighboring tokens stay separate comments
description: "A separator between two commented tokens must keep the comments on separate lines."
group: "Line endings and comment placement"
---

## Input

```flix
def a(): Unit = g(1 // before the comma
    , // after the comma
    x -> { println(x) })

def b(): Int32 = x + // after the operator
    y

def table():List[(String,Int32)]=List#{
("A",8) // before the comma
, // after the comma
("Library",126)
}
```

## Output

```flix
def a(): Unit = g(
    1,  // before the comma
    // after the comma
    x -> { println(x) }
)

def b(): Int32 = x +  // after the operator
    y

def table(): List[(String, Int32)] = List#{
    ("A", 8),  // before the comma
    // after the comma
    ("Library", 126)
}
```
