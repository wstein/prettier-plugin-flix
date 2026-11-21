---
title: "Do not reserve a hugged-body trailer for a call that may move below `=`"
description: "placeBody keeps only brace-closed or always-breaking bodies on the `=` line; a call that can wrap below must not widen the effect-set trailer in pass 1."
group: "Calls and function signatures"
flix: "0.80"
options: { printWidth: 33 }
---

## Input

```flix
def wait(c: Chan, d: Deadline): Unit \ { Chan, NonDet } = foo(c, d)
```

## Output

```flix
def wait(c: Chan, d: Deadline):
    Unit \ { Chan, NonDet } =
    foo(c, d)
```
