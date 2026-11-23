---
title: "Fit a match signature with an own-line comment after an access dot"
description: "The comment already breaks the line after the dot. A space before that break must not change whether the effect set fits beside the match expression."
group: "Calls and function signatures"
flix: "0.80"
options: { printWidth: 40 }
---

## Input

```flix
mod Demo {
    def wait(c: Chan, d: Deadline): Unit \ { Chan, NonDet } = match some.
        // own
        long(argumentOne, argumentTwo) {
        case _ => ()
    }
}
```

## Output

```flix
mod Demo {
    def wait(c: Chan, d: Deadline): Unit
        \ { Chan, NonDet } = match some.
    // own
    long(argumentOne, argumentTwo) {
        case _ => ()
    }
}
```

```flix printWidth=41
mod Demo {
    def wait(c: Chan, d: Deadline): Unit
        \ { Chan, NonDet } = match some.
    // own
    long(argumentOne, argumentTwo) {
        case _ => ()
    }
}
```
