---
title: Preserve emoji and spaces in a list of strings
description: Wrapped list operators start each continuation line. The spaces and Unicode characters inside the strings stay exactly as written.
group: String forms
flix: "0.80"
options: { printWidth: 44 }
---

## Input

```flix
pub def departures(): List[String] = {
    "  🚆 Berlin  " :: "  🛤️ Köln  " :: "  🚉 Bonn  " :: Nil
}
```

## Output

```flix
pub def departures(): List[String] = {
    "  🚆 Berlin  "
        :: "  🛤️ Köln  "
        :: "  🚉 Bonn  "
        :: Nil
}
```
