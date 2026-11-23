---
title: Reject a trailing comma in a function call
description: A comma separates arguments. Flix 0.80 reports a parse error when a call has a comma after its last argument.
status: error
---

## Input

```flix
pub def minimum(): Int32 = Int32.min(1, 2,)
```
