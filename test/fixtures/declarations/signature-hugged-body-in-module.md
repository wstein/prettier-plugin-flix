---
title: "Measure the hugged body at the width left inside the module"
description: "The first line of a hugged body that shares the `=` line is printed at the print width minus the declaration indent, so a def inside a module reserves the same room as pass 2."
group: "Calls and function signatures"
options: { printWidth: 45 }
---

## Input

```flix
mod M {
    def wait(c: Chan, d: Deadline): Unit \ { Chan, NonDet } = match someLong(argumentOne, argumentTwo) {
        case _ => ()
    }
}
```

## Output

```flix
mod M {
    def wait(c: Chan, d: Deadline): Unit
        \ { Chan, NonDet } = match someLong(
        argumentOne,
        argumentTwo
    ) {
        case _ => ()
    }
}
```

```flix printWidth=44
mod M {
    def wait(c: Chan, d: Deadline): Unit
        \ { Chan, NonDet } = match someLong(
        argumentOne,
        argumentTwo
    ) {
        case _ => ()
    }
}
```
