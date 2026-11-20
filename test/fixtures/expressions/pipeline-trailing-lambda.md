---
title: "Keep trailing lambdas in pipeline steps idempotent"
description: "A pipeline step whose last argument is a braced lambda must hug the same way on every pass."
flix: "0.80"
options: { printWidth: 46 }
---

## Input

```flix
import java.lang.StringBuilder

def iterator(rc: Region[r1], sb: StringBuilder): Iterator[Char, r1, r1] \ r1 =
    Iterator.range(rc, 0, 10) |> Iterator.map(i -> unsafe IO as r1 { sb.charAt(i) })
```

## Output

```flix
import java.lang.StringBuilder

def iterator(
    rc: Region[r1],
    sb: StringBuilder
): Iterator[Char, r1, r1] \ r1 =
    Iterator.range(rc, 0, 10)
        |> Iterator.map(
            i -> unsafe IO as r1 {
                sb.charAt(i)
            }
        )
```

```flix printWidth=100
import java.lang.StringBuilder

def iterator(rc: Region[r1], sb: StringBuilder): Iterator[Char, r1, r1] \ r1 =
    Iterator.range(rc, 0, 10) |> Iterator.map(i -> unsafe IO as r1 { sb.charAt(i) })
```
