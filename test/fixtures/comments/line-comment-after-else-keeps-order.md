---
title: A line comment after else stays in front of the comments in the else branch
description: "The comment after else is deferred to the end of the line, so a later block comment in the branch must not end up in front of it. The branch starts on its own line."
group: "Calls, blocks, and control flow"
flix: "0.80"
status: todo
issue: "https://github.com/wstein/prettier-plugin-flix/issues/211"
---

## Input

```flix
def f(): Int32 = if (true) 1 else // note
    x /* B */
```

## Output

```flix
def f(): Int32 = if (true)
    1
else  // note
    x /* B */
```
