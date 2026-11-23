---
title: Constraint sets
description: "The space or newline after a terminating dot keeps consecutive Datalog constraints distinct."
---

## Input

```flix
def g(): #{Edge(Int32, Int32)} = #{Edge(1,2). Edge(2,3).}
```

## Output

```flix
def g(): #{ Edge(Int32, Int32) } = #{ Edge(1, 2). Edge(2, 3). }
```
