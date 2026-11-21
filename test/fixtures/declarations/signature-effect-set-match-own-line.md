---
title: "Count the gap after `match` when an own-line comment follows"
description: "When `= match` is followed by an own-line comment before the scrutinee, the hugged-body trailer still reserves the gap before that break (#201). Width 30 must stay idempotent."
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
