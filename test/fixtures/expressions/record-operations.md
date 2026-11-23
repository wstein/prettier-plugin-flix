---
title: "Record types, updates, and field selection"
description: "Distinguish a record field update from a block and preserve the field selection after a record expression."
---

## Input

```flix
pub def rename(r:{name=String,count=Int32}):String={
let updated={name="Flix"|r};
updated#name
}
```

## Output

```flix
pub def rename(r: {name = String, count = Int32}): String = {
    let updated = {name = "Flix" | r};
    updated#name
}
```
