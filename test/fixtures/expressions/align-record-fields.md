---
title: "Align equals signs in multiline record literals"
description: "Simple fields align their equals signs. A compound field value or a large gap between field names keeps ordinary spacing."
flix: "0.80"
---

## Input

```flix
pub def profile(): {id = Int32, name = String, active = Bool} = {
id=7,
name="Flix",
active=true
}

pub def palette(): {x = String, color = String} = {
x="red",
color="blue"+"-green"
}

pub def item(): {x = String, description = String} = {
x="open",
description="Ready to use"
}
```

## Output

```flix
pub def profile(): { id = Int32, name = String, active = Bool } = {
    id     = 7,
    name   = "Flix",
    active = true
}

pub def palette(): { x = String, color = String } = {
    x = "red",
    color = "blue" + "-green"
}

pub def item(): { x = String, description = String } = {
    x = "open",
    description = "Ready to use"
}
```
