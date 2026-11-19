---
title: prettier-ignore keeps the next declaration as written
description: "The desired behavior preserves only the declaration following the directive and still formats the next declaration."
flix: "0.80"
status: todo
issue: not supported yet (see README, Limits)
---

## Input

```flix
// prettier-ignore
def   keep(x:Int32):Int32=x+1

def  format(x:Int32):Int32=x+1
```

## Output

```flix
// prettier-ignore
def   keep(x:Int32):Int32=x+1

def format(x: Int32): Int32 = x + 1
```
