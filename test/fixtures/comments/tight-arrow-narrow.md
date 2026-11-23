---
title: A field-access arrow stays tight between comments at narrow widths
description: "A narrow line width can wrap the signature without inserting space around the commented field-access arrow."
group: "Whitespace-sensitive operators"
---

## Input

```flix
def longField(s: S[r]): Int32 = s/* receiver */->// field
veryLongFieldName
```

## Output

```flix
def longField(s: S[r]): Int32 = s/* receiver */->// field
veryLongFieldName
```

```flix printWidth=20
def longField(
    s: S[r]
): Int32 = s/* receiver */->// field
veryLongFieldName
```
