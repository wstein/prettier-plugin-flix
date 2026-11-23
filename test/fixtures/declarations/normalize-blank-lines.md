---
title: "Reduce consecutive blank lines"
description: "A single blank line still separates the definitions, while the extra empty lines disappear."
showcase: 4
---

## Input

```flix
pub def first(): Int32 = 1




pub def second(): Int32 = 2
```

## Output

```flix
pub def first(): Int32 = 1

pub def second(): Int32 = 2
```
