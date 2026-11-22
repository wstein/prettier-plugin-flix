---
title: Reject a backslash string continuation under Flix 0.79.0
description: "findStringContinuationError must use the selected grammar's STRING_CONTENT token; the same escape is rejected under both pins (#224 post-merge)."
flix: "0.79"
options: { flixVersion: "0.79.0" }
status: error
message: "backslash cannot continue a string"
issue: "https://github.com/wstein/prettier-plugin-flix/pull/224"
---

## Input

```flix
def receipt(cents: Int32): String =
    "${cents} cents \
including shipping"
```
