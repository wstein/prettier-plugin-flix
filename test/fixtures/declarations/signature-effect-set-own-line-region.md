---
title: "Skip the hugged-body trailer when `=` follows an own-line comment before a region"
description: "ownLineEquals must clear the hugged-body width for `= region ...` after an own-line comment; otherwise width 23 joins the effect set."
group: "Calls and function signatures"
options: { printWidth: 23 }
---

## Input

```flix
def wait(c: Chan, d: Deadline): Unit \ { Chan, NonDet }
// own
= region rc {
    ()
}
```

## Output

```flix
def wait(
    c: Chan,
    d: Deadline
): Unit
    \ { Chan, NonDet }
// own
= region rc {
    ()
}
```
