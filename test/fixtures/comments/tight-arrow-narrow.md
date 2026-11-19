---
title: A field-access arrow stays tight between comments at narrow widths
flix: "0.80"
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
