---
title: Long argument lists wrap one per line
flix: "0.80"
---

## Input

```flix
def f(): Int32 = g(aaaaaaaaaaaaaaaa, bbbbbbbbbbbbbbbbbbbb, cccccccccccccccccccc, dddddddddddddddddddd)
```

## Output

```flix
def f(): Int32 =
    g(
        aaaaaaaaaaaaaaaa,
        bbbbbbbbbbbbbbbbbbbb,
        cccccccccccccccccccc,
        dddddddddddddddddddd
    )
```

```flix printWidth=120
def f(): Int32 = g(aaaaaaaaaaaaaaaa, bbbbbbbbbbbbbbbbbbbb, cccccccccccccccccccc, dddddddddddddddddddd)
```
