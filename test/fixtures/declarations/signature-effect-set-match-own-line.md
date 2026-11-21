---
title: "Skip the hugged-body trailer when an own-line comment follows `match`"
description: "When `= match` is followed by an own-line comment before the scrutinee, pass 2 does not keep the rest of the body on the signature line (#201). Width 30 must stay idempotent."
group: "Calls and function signatures"
flix: "0.80"
options: { printWidth: 30 }
---

## Input

```flix
def wait(c: Chan, d: Deadline): Unit \ { Chan, NonDet } = match
// own
c {
    case _ => ()
}
```

## Output

```flix
def wait(
    c: Chan,
    d: Deadline
): Unit \ {
    Chan,
    NonDet
} = match
// own
c {
    case _ => ()
}
```
