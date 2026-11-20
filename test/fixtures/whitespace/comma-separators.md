---
title: Keep commas after entries in wrapped lists
description: Commas follow each entry that has another entry after it. The Flix 0.80 compiler rejects a comma after the final entry in both use lists and function calls.
flix: "0.80"
---

## Input

```flix
use List.{map=>mapValues,filter=>keepMatching}
pub def positiveSizes(xs:List[String]):List[Int32]=mapValues(String.length,keepMatching(s -> String.length(s)>0,xs))
```

## Output

```flix
use List.{map => mapValues, filter => keepMatching}
pub def positiveSizes(xs: List[String]): List[Int32] =
    mapValues(String.length, keepMatching(s -> String.length(s) > 0, xs))
```

```flix printWidth=40
use List.{
    map => mapValues,
    filter => keepMatching
}
pub def positiveSizes(xs: List[String]):
    List[Int32] =
    mapValues(
        String.length,
        keepMatching(
            s -> String.length(s) > 0,
            xs
        )
    )
```
