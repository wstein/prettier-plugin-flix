---
title: "Keep inject stable after comments around a statement separator"
description: "A comment lifted from the semicolon stays above inject without forcing the into clause to wrap."
options: { printWidth: 60 }
issue: "https://github.com/wstein/prettier-plugin-flix/issues/211"
---

## Input

```flix
def injectAfterComments(): #{ A(Int32) } =
    let v = Vector#{1, 2} // before the separator
    ; // after the separator
    inject v into A/1
```

## Output

```flix
def injectAfterComments(): #{ A(Int32) } =
    let v = Vector#{1, 2};  // before the separator
    // after the separator
    inject v into A/1
```

```flix printWidth=100
def injectAfterComments(): #{ A(Int32) } =
    let v = Vector#{1, 2};  // before the separator
    // after the separator
    inject v into A/1
```
