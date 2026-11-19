---
title: "Whitespace-sensitive syntax"
description: "See cases where moving spaces changes the meaning of Flix tokens."
---

## Commas in wrapped lists

Commas stay at the end of the line after each entry that has another entry
after it. Flix 0.80 reports E6518 for a comma after the last argument in a call
or the last entry in a `use` list. The plugin's current grammar also accepts
a trailing comma in `use` lists, so the compiler may still reject that input.

See [wrapped imports and calls](#comma-separators) and the
[trailing comma error fixture](../errors/#trailing-comma-in-call).
