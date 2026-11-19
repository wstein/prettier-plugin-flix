---
title: A line comment before a semicolon neither breaks the expression nor fuses with the next comment
description: "A semicolon may move beside the preceding expression, but the two line comments must remain separate."
group: "Line endings and comment placement"
flix: "0.80"
---

## Input

```flix
def f(): Int32 = {
    let a = x + y * 2 // note
    ;
    let b = a // first
    ; // second
    b
}
```

## Output

```flix
def f(): Int32 = {
    let a = x + y * 2; // note
    let b = a; // first
    // second
    b
}
```
