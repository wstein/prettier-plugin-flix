---
title: Reject a backslash followed by a literal newline in a string
description: "Flix 0.80 rejects this escape sequence as E9689. Use an escaped newline or concatenate two strings."
status: error
message: "backslash cannot continue a string"
---

## Input

```flix
def receipt(cents: Int32): String =
    "${cents} cents \
including shipping"
```
