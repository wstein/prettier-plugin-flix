---
title: "Count a willBreak lambda body in the hugged-body trailer"
description: "A trailing lambda that always breaks still shares the `=` line via placeBody; dropping the willBreak check makes the effect-set break non-idempotent at width 33."
group: "Calls and function signatures"
flix: "0.80"
options: { printWidth: 33 }
---

## Input

```flix
def wait(c: Chan, d: Deadline): Unit \ { Chan, NonDet } = foo(c, x -> {
    let y = 1;
    y
})
```

## Output

```flix
def wait(
    c: Chan,
    d: Deadline
): Unit \ { Chan, NonDet } = foo(
    c,
    x -> {
        let y = 1;
        y
    }
)
```
