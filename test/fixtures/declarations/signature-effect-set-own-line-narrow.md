---
title: "Reserve the gap before an own-line comment when fitting an effect set"
description: "An own-line comment before `=` still leaves a one-column gap on the signature line; ignoring it breaks before `\\` at width 22."
group: "Calls and function signatures"
flix: "0.80"
options: { printWidth: 22 }
---

## Input

```flix
def wait(rx: Receiver[Int32], n: Int32, tx: Sender[List[Int32]]): Unit \ { Chan, NonDet }
// own
= 1
```

## Output

```flix
def wait(
    rx: Receiver[
        Int32
    ],
    n: Int32,
    tx: Sender[
        List[Int32]
    ]
): Unit \ {
    Chan,
    NonDet
}
// own
= 1
```

```flix printWidth=23
def wait(
    rx: Receiver[
        Int32
    ],
    n: Int32,
    tx: Sender[
        List[Int32]
    ]
): Unit
    \ { Chan, NonDet }
// own
= 1
```
