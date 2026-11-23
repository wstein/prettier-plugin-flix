---
title: Align handler clause equals under Flix 0.79.0
description: "layoutSource must reparse with flixVersion 0.79.0 and bind that grammar's HandlerExprContext; otherwise neighboring def clauses lose their shared `=` column (#224 post-merge)."
group: "Calls and function signatures"
options: { printWidth: 80, flixVersion: "0.79.0" }
issue: "https://github.com/wstein/prettier-plugin-flix/pull/224"
minVersion: "0.79.0"
maxVersion: "0.79.0"
---

## Input

```flix
def runWithFileStat(f: Unit -> a \ ef): a \ (ef - FilePermission) + FileStat =
    run { f() } with handler FilePermission {
        def isReadable(filename, k) = k(Fs.FileStat.isReadable(filename))
        def isWritable(filename, k) = k(Fs.FileStat.isWritable(filename))
        def isExecutable(filename, k) = k(Fs.FileStat.isExecutable(filename))
    }
```

## Output

```flix
def runWithFileStat(f: Unit -> a \ ef): a \ (ef - FilePermission) + FileStat =
    run { f() } with handler FilePermission {
        def isReadable(filename, k)   = k(Fs.FileStat.isReadable(filename))
        def isWritable(filename, k)   = k(Fs.FileStat.isWritable(filename))
        def isExecutable(filename, k) = k(Fs.FileStat.isExecutable(filename))
    }
```
