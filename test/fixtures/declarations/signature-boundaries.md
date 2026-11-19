---
title: Wrap at signature boundaries
description: "Keep a short return type, record or effect set together when a clause can move to a continuation line."
flix: "0.80"
---

## Input

```flix
eff Console {
    def confirm(p: a, default: {default = Bool}): Bool \ Console with ToString[a]
}
def wait(rx: Receiver[Int32], n: Int32, tx: Sender[List[Int32]]): Unit \ { Chan, NonDet } =
    Channel.send(recvN(n, rx), tx)
```

## Output

```flix
eff Console {
    def confirm(p: a, default: {
        default = Bool
    }): Bool \ Console with ToString[a]
}
def wait(rx: Receiver[Int32], n: Int32, tx: Sender[List[Int32]]): Unit
    \ { Chan, NonDet } = Channel.send(recvN(n, rx), tx)
```
