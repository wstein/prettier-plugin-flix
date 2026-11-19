---
title: "Keep map entry comments in place"
description: "A map with a line comment after an entry uses ordinary spacing."
flix: "0.80"
---

## Input

```flix
pub def reviewed(): Map[Int32, Int32] = Map#{
7=>20, // reviewed
2000=>3
}
```

## Output

```flix
pub def reviewed(): Map[Int32, Int32] = Map#{
    7 => 20, // reviewed
    2000 => 3
}
```
