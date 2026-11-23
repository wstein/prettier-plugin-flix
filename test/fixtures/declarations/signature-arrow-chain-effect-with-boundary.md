---
title: "Arrow chain followed by an effect set and a with list keeps the effect word as the next word"
description: "The word that follows a return type arrow chain is the start of the effect set, not of the `with` list: the chain moves to its own line when ` \\` fits after it there, even if ` with` would not."
group: "Types and constraints"
options: { printWidth: 40 }
---

## Input

```flix
pub def f13(x: Int32, y: Int32): Int32 -> Int32 -> Txxxxxxxxxxxxx \ (ef - Logger) + Fs.FileWrite + Abort + Net.Http + Fs.FileRead with Order[a], Order[b], Order[c], Order[d], Order[e] = x -> y -> z
```

## Output

```flix
pub def f13(x: Int32, y: Int32):
    Int32 -> Int32 -> Txxxxxxxxxxxxx \ (
    ef - Logger
) + Fs.FileWrite + Abort + Net.Http + Fs.FileRead with
        Order[a],
        Order[b],
        Order[c],
        Order[d],
        Order[e] = x -> y -> z
```
