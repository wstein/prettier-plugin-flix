---
title: tabWidth sets the indentation
description: "The default output indents by four spaces. The alternate output uses two."
flix: "0.80"
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

```flix tabWidth=2
def f(): Int32 = {
  1
}
```
