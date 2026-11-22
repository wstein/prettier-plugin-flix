---
title: "Arrow chain and the effect set share the signature line up to the print width"
description: "A return type arrow chain whose line on the signature stays within the print width keeps its place when only the effect set wraps; one column more moves the chain to its own line."
group: "Types and constraints"
flix: "0.80"
options: { printWidth: 50 }
---

## Input

```flix
pub def hhhhhhhhhhhhhhhhh(x: Int32): a -> b -> c \ (ef - Logger) + Fs.FileWrite + Fs.FileRead + Abort + Net.Http = x -> y -> x

pub def hhhhhhhhhhhhhhhhhh(x: Int32): a -> b -> c \ (ef - Logger) + Fs.FileWrite + Fs.FileRead + Abort + Net.Http = x -> y -> x
```

## Output

```flix
pub def hhhhhhhhhhhhhhhhh(x: Int32): a ->
    b ->
        c \ (
    ef - Logger
) + Fs.FileWrite + Fs.FileRead + Abort + Net.Http =
    x -> y -> x

pub def hhhhhhhhhhhhhhhhhh(x: Int32):
    a -> b -> c \ (
    ef - Logger
) + Fs.FileWrite + Fs.FileRead + Abort + Net.Http =
    x -> y -> x
```
