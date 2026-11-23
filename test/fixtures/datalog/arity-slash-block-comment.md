---
title: "Keep a space between the arity slash and a block comment"
description: "A block comment after `/` must not glue into `//`, or the arity no longer parses."
options: { printWidth: 60 }
---

## Input

```flix
def injectArity(): #{ A(Int32) } =
    let p = inject Vector#{1} into A/ /* note */ 1;
    solve p project A
```

## Output

```flix
def injectArity(): #{ A(Int32) } =
    let p = inject Vector#{1} into A/ /* note */ 1;
    solve p project A
```

```flix printWidth=40
def injectArity(): #{ A(Int32) } =
    let p =
        inject Vector#{1}
            into A/ /* note */ 1;
    solve p project A
```

```flix printWidth=100
def injectArity(): #{ A(Int32) } =
    let p = inject Vector#{1} into A/ /* note */ 1;
    solve p project A
```
