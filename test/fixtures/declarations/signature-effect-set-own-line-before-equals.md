---
title: "Do not reserve a hugged-body trailer when `=` follows an own-line comment"
description: "An own-line comment before `=` keeps the equals and body off the signature line, so the effect-set break must not count a same-line body trailer."
group: "Calls and function signatures"
flix: "0.80"
options: { printWidth: 100 }
---

## Input

```flix
def wait(rx: Receiver[Int32], n: Int32, tx: Sender[List[Int32]]): Unit \ { Chan, NonDet }
// own
= Channel.send(recvN(n, rx), tx)
```

## Output

```flix
def wait(rx: Receiver[Int32], n: Int32, tx: Sender[List[Int32]]): Unit \ { Chan, NonDet }
// own
= Channel.send(recvN(n, rx), tx)
```

```flix printWidth=60
def wait(
    rx: Receiver[Int32],
    n: Int32,
    tx: Sender[List[Int32]]
): Unit \ { Chan, NonDet }
// own
= Channel.send(recvN(n, rx), tx)
```
