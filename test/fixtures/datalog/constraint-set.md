---
title: Constraint sets
flix: "0.80"
---

## Input

```flix
def g(): #{Edge(Int32, Int32)} = #{Edge(1,2). Edge(2,3).}
```

## Output

```flix
def g(): #{ Edge(Int32, Int32) } = #{ Edge(1, 2). Edge(2, 3). }
```
