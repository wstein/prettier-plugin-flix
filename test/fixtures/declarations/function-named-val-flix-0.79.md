---
title: "Format a function named val under Flix 0.79.0"
description: "Flix 0.79.0 accepts val as a function name. Flix 0.80.0 reserves it as a keyword."
options: { flixVersion: "0.79.0" }
issue: "https://github.com/wstein/prettier-plugin-flix/issues/214"
minVersion: "0.79.0"
maxVersion: "0.79.0"
---

## Input

```flix
def val():Int32=40+2
```

## Output

```flix
def val(): Int32 = 40 + 2
```
