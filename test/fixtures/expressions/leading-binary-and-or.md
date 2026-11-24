---
title: Leading and/or operators when chains wrap
description: "Boolean `and` / `or` chains stay compact when they fit and break before each operator when they wrap, matching flix format's prettyBinary."
options: { printWidth: 80 }
---

## Input

```flix
def compact(): Bool = a and b or c

def andChain(): Bool = veryLongNameAAAAAAAA and veryLongNameBBBBBBBB and veryLongNameCCCCCCCC and veryLongNameDDDDDDDD

def orChain(): Bool = veryLongNameAAAAAAAA or veryLongNameBBBBBBBB or veryLongNameCCCCCCCC or veryLongNameDDDDDDDD
```

## Output

```flix
def compact(): Bool = a and b or c

def andChain(): Bool =
    veryLongNameAAAAAAAA
        and veryLongNameBBBBBBBB
        and veryLongNameCCCCCCCC
        and veryLongNameDDDDDDDD

def orChain(): Bool =
    veryLongNameAAAAAAAA
        or veryLongNameBBBBBBBB
        or veryLongNameCCCCCCCC
        or veryLongNameDDDDDDDD
```

```flix printWidth=40
def compact(): Bool = a and b or c

def andChain(): Bool =
    veryLongNameAAAAAAAA
        and veryLongNameBBBBBBBB
        and veryLongNameCCCCCCCC
        and veryLongNameDDDDDDDD

def orChain(): Bool =
    veryLongNameAAAAAAAA
        or veryLongNameBBBBBBBB
        or veryLongNameCCCCCCCC
        or veryLongNameDDDDDDDD
```
