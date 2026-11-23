---
title: "Index a vector inside unsafe"
group: "Additional language constructs"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Exp.Unsafe.flix#L18"
---

## Input

```flix
@Test
def test04(): Unit \ Assert =
    assertEq(expected = 2, unsafe OutOfBounds { Vector#{1, 2, 3}[1] })
```

## Output

```flix
@Test
def test04(): Unit \ Assert =
    assertEq(expected = 2, unsafe OutOfBounds { Vector#{1, 2, 3} [1] })
```
