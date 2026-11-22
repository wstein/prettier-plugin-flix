---
title: "Keep a return type arrow chain on the signature line when only the effect set wraps"
description: "A return type arrow chain of two or more arrows that fits after the parameters stays there when no `with` list is present and only the effect set wraps."
group: "Types and constraints"
flix: "0.80"
options: { printWidth: 40 }
---

## Input

```flix
mod Logger {
    pub def handleWithFileWriteAbort(file: String, f: a -> b \ ef): a -> b -> c \ (ef - Logger) + Fs.FileWrite + Abort =
        x -> f(x)

    pub def handleWithFileWrite(file: String, f: a -> b \ ef): a -> b -> c \ (ef - Logger) + Fs.FileWrite =
        x -> f(x)
}
```

## Output

```flix
mod Logger {
    pub def handleWithFileWriteAbort(
        file: String,
        f: a -> b \ ef
    ): a -> b -> c \ (
        ef - Logger
    ) + Fs.FileWrite + Abort = x -> f(x)

    pub def handleWithFileWrite(
        file: String,
        f: a -> b \ ef
    ): a -> b -> c
        \ (ef - Logger) + Fs.FileWrite =
        x -> f(x)
}
```

```flix printWidth=50
mod Logger {
    pub def handleWithFileWriteAbort(
        file: String,
        f: a -> b \ ef
    ): a -> b -> c
        \ (ef - Logger) + Fs.FileWrite + Abort =
        x -> f(x)

    pub def handleWithFileWrite(
        file: String,
        f: a -> b \ ef
    ): a -> b -> c
        \ (ef - Logger) + Fs.FileWrite = x -> f(x)
}
```

```flix printWidth=60
mod Logger {
    pub def handleWithFileWriteAbort(
        file: String,
        f: a -> b \ ef
    ): a -> b -> c \ (ef - Logger) + Fs.FileWrite + Abort =
        x -> f(x)

    pub def handleWithFileWrite(
        file: String,
        f: a -> b \ ef
    ): a -> b -> c \ (ef - Logger) + Fs.FileWrite =
        x -> f(x)
}
```
