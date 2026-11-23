---
title: "Do not reserve a hugged-body trailer when `=` follows an own-line block comment"
description: "An own-line block comment before `=` keeps the equals and body off the signature line, as an own-line line comment does."
group: "Calls and function signatures"
options: { printWidth: 30 }
---

## Input

```flix
def shuffle(rc1: Region[r1], d: MutDeque[a, r2]): MutDeque[a, r1] \ { r2, r1, Shuffle }
    /* b */
    = region rc3 {
    result
}
```

## Output

```flix
def shuffle(
    rc1: Region[r1],
    d: MutDeque[a, r2]
): MutDeque[a, r1]
    \ { r2, r1, Shuffle }
/* b */
= region rc3 {
    result
}
```

```flix printWidth=50
def shuffle(rc1: Region[r1], d: MutDeque[a, r2]):
    MutDeque[a, r1] \ { r2, r1, Shuffle }
/* b */
= region rc3 {
    result
}
```
