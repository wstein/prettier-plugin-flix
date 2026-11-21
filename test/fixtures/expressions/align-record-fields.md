---
title: "Align equals signs in multiline record literals"
description: "Simple fields align their equals signs. A field without a comment separates the adjacent comment groups. A line comment before a separator starts a new alignment group. Short additive expressions can align. Large gaps between field names keep ordinary spacing."
flix: "0.80"
---

## Input

```flix
pub def profile(): {id = Int32, name = String, active = Bool} = {
id=7, // Assigned by the server.
name="Flix",
active=true // Active accounts can sign in.
}

pub def notedProfile(): {id = Int32, name = String, active = Bool} = {
id=7 // note
, // Assigned by the server.
name="Flix",
active=true // Active accounts can sign in.
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
    id     = 7,  // Assigned by the server.
    name   = "Flix",
    active = true  // Active accounts can sign in.
}

pub def notedProfile(): { id = Int32, name = String, active = Bool } = {
    id = 7,  // note
    // Assigned by the server.
    name   = "Flix",
    active = true  // Active accounts can sign in.
}

pub def palette(): { x = String, color = String } = {
    x     = "red",
    color = "blue" + "-green"
}

pub def item(): { x = String, description = String } = {
    x = "open",
    description = "Ready to use"
}
```

```flix printWidth=30
pub def profile(): {
    id = Int32,
    name = String,
    active = Bool
} = {
    id     = 7,  // Assigned by the server.
    name   = "Flix",
    active = true  // Active accounts can sign in.
}

pub def notedProfile(): {
    id = Int32,
    name = String,
    active = Bool
} = {
    id = 7,  // note
    // Assigned by the server.
    name   = "Flix",
    active = true  // Active accounts can sign in.
}

pub def palette(): {
    x = String,
    color = String
} = {
    x     = "red",
    color = "blue" + "-green"
}

pub def item(): {
    x = String,
    description = String
} = {
    x = "open",
    description = "Ready to use"
}
```
