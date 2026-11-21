---
title: "Keep source-vertical blocks in a match arm with a trailing block comment"
description: "A trailing block comment inside an arm body must not collapse the blocks of that arm onto one line."
group: "Line endings and comment placement"
flix: "0.80"
options: { printWidth: 100 }
---

## Input

```flix
def sign(x: Int32): Int32 = match x {
    case 0 => 0
    case _ => if (x > 1) {
        1 /* note */
    } else {
        -1
    }
}
```

## Output

```flix
def sign(x: Int32): Int32 = match x {
    case 0 => 0
    case _ => if (x > 1) {
        1 /* note */
    } else {
        -1
    }
}
```

```flix printWidth=40
def sign(x: Int32): Int32 = match x {
    case 0 => 0
    case _ => if (x > 1) {
        1 /* note */
    } else {
        -1
    }
}
```
