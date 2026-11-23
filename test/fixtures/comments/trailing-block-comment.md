---
title: Block comments at the end of a line stay with the preceding code
---

## Input

```flix
def first():Int32=1 /* first */ /* still first */
/* second */ def second():Int32=2
```

## Output

```flix
def first(): Int32 = 1 /* first */ /* still first */
/* second */ def second(): Int32 = 2
```
