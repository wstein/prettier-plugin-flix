---
title: "Align match arms when the longest arm ends exactly at the print width"
description: "An arm that is exactly print-width wide has not wrapped, so the short arm still pads to the arrow column even when its head is more than 16 columns shorter."
group: "Operators"
options: { printWidth: 46 }
---

## Input

```flix
def f(x: Int32): Int32 = match x {
    case A => 1
    case Bbbbbbbbbbbbbbbbbbbbbbb => bbbbbbbbbb
}
```

## Output

```flix
def f(x: Int32): Int32 = match x {
    case A                       => 1
    case Bbbbbbbbbbbbbbbbbbbbbbb => bbbbbbbbbb
}
```

```flix printWidth=47
def f(x: Int32): Int32 = match x {
    case A                       => 1
    case Bbbbbbbbbbbbbbbbbbbbbbb => bbbbbbbbbb
}
```
