---
title: "Count the gap after `match` when an own-line comment follows"
description: "When `= match` is followed by an own-line comment before the scrutinee, the hugged-body trailer still reserves the gap before that break (#201). Widths 30 (regression vs main) and 35 (where main fails) must stay idempotent."
group: "Calls and function signatures"
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

```flix printWidth=35
def wait(
    c: Chan,
    d: Deadline
): Unit \ { Chan, NonDet } = match
// own
c {
    case _ => ()
}
```

```flix printWidth=64
def wait(c: Chan, d: Deadline): Unit \ { Chan, NonDet } = match
// own
c {
    case _ => ()
}
```
