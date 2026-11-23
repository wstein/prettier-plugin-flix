---
title: "Keep the solve clause stable after comments around a statement separator"
description: "A comment that moves from the semicolon to its own line must not force the following solve clause to wrap."
options: { printWidth: 60 }
issue: "https://github.com/wstein/prettier-plugin-flix/issues/211"
---

## Input

```flix
def injectArity(): #{ A(Int32) } =
    let p = inject Vector#{1
// inside vector
} into A/ /* arity */ 1 // before separator
; // after separator

    solve p project A
```

## Output

```flix
def injectArity(): #{ A(Int32) } =
    let p = inject Vector#{
        1
        // inside vector
    }
        into A/ /* arity */ 1;  // before separator
    // after separator

    solve p project A
```

```flix printWidth=100
def injectArity(): #{ A(Int32) } =
    let p = inject Vector#{
        1
        // inside vector
    }
        into A/ /* arity */ 1;  // before separator
    // after separator

    solve p project A
```
