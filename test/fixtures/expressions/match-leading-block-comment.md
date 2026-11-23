---
title: "Align match arms when a block comment leads the first case"
description: "A block comment after match { must leave the measured case head, so arrow padding matches the pass where the comment is already on its own line."
group: "Line endings and comment placement"
options: { printWidth: 40 }
---

## Input

```flix
def f(x: Option[Int32]): Int32 = {let y = 1;
match x { /* note */ case Some(v) => v+y
case None => y}}
```

## Output

```flix
def f(x: Option[Int32]): Int32 = {
    let y = 1;
    match x {
        /* note */ case Some(v) => v + y
        case None    => y
    }
}
```

```flix printWidth=60
def f(x: Option[Int32]): Int32 = {
    let y = 1;
    match x {
        /* note */ case Some(v) => v + y
        case None    => y
    }
}
```

```flix printWidth=100
def f(x: Option[Int32]): Int32 = {
    let y = 1;
    match x {
        /* note */ case Some(v) => v + y
        case None    => y
    }
}
```
