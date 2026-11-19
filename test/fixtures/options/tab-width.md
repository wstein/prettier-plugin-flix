---
title: tabWidth sets the indentation
description: "Comparing both output blocks shows how tabWidth changes indentation without changing the program."
flix: "0.80"
options:
  tabWidth: 2
---

## Input

```flix
def f(): Int32 = {
1
}
```

## Output

```flix
def f(): Int32 = {
  1
}
```
