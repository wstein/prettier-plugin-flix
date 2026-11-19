---
title: A comment after a block's closing brace does not expand the block
description: "The comment follows the closing brace. It does not force the body of a short block onto multiple lines."
group: "Calls, blocks, and control flow"
flix: "0.80"
---

## Input

```flix
def a(): Unit = { println(1) } // c

def b(): Unit = if (true) { println(1) } /* c */ else { println(2) }
```

## Output

```flix
def a(): Unit = { println(1) }  // c

def b(): Unit = if (true) { println(1) } /* c */ else { println(2) }
```
