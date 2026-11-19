---
title: "Map entries and index selection"
group: "Additional language constructs"
flix: "0.80"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Exp.Indexable.flix#L86"
---

## Input

```flix
@Test
def map04(): Unit \ Assert =
    let m = Map#{0 => 1, 1 => 2, 2 => 3, 3 => 4};
    assertTrue(run m[3] == 4 with handle)
```

## Output

```flix
@Test
def map04(): Unit \ Assert =
    let m = Map#{0 => 1, 1 => 2, 2 => 3, 3 => 4};
    assertTrue(run m[3] == 4 with handle)
```
