---
title: "Align after a line comment before the comma when the next entry has a block lead"
description: "A line trail before the comma plus an inline block lead on the next entry must split and measure the same way on both passes."
group: "Line endings and comment placement"
options: { printWidth: 80 }
---

## Input

```flix
pub def a(): Map[String, Int32] = Map#{
"batch"      =>2,
"export"=>1 // note
, /* c */ "sync"=>120 // Sync attempts are cheap.
}

pub def f(): {id = Int32, name = String, active = Bool} = {
id=7 // note
, /* Assigned */ name="Flix",
active=true // Active accounts can sign in.
}
```

## Output

```flix
pub def a(): Map[String, Int32] = Map#{
    "batch"  => 2,
    "export" => 1,         // note
    /* c */ "sync" => 120  // Sync attempts are cheap.
}

pub def f(): {id = Int32, name = String, active = Bool} = {
    id = 7,  // note
    /* Assigned */ name   = "Flix",
    active = true  // Active accounts can sign in.
}
```

```flix printWidth=40
pub def a(): Map[String, Int32] = Map#{
    "batch"  => 2,
    "export" => 1,  // note
    /* c */ "sync" => 120  // Sync attempts are cheap.
}

pub def f(): {
    id = Int32,
    name = String,
    active = Bool
} = {
    id = 7,  // note
    /* Assigned */ name   = "Flix",
    active = true  // Active accounts can sign in.
}
```

```flix printWidth=60
pub def a(): Map[String, Int32] = Map#{
    "batch"  => 2,
    "export" => 1,         // note
    /* c */ "sync" => 120  // Sync attempts are cheap.
}

pub def f(): {id = Int32, name = String, active = Bool} = {
    id = 7,  // note
    /* Assigned */ name   = "Flix",
    active = true  // Active accounts can sign in.
}
```
