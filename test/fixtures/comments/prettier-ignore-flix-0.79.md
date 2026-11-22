---
title: prettier-ignore keeps the next declaration under Flix 0.79.0
description: "ignoredDeclarationEnd must use DeclarationContext from the selected grammar; binding the 0.80 class drops the ignore under 0.79 (#224 post-merge)."
group: "Line endings and comment placement"
flix: "0.79"
options: { flixVersion: "0.79.0" }
issue: "https://github.com/wstein/prettier-plugin-flix/pull/224"
---

## Input

```flix
// prettier-ignore
def   keep(x:Int32):Int32=x+1

def  format(x:Int32):Int32=x+1
```

## Output

```flix
// prettier-ignore
def   keep(x:Int32):Int32=x+1

def format(x: Int32): Int32 = x + 1
```
