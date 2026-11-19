---
title: A comment after a block's closing brace does not expand the block
flix: "0.80"
---

## Input

```flix
def a(): Unit = { println(1) } // c

def b(): Unit = if (true) { println(1) } /* c */ else { println(2) }
```

## Output

```flix
def a(): Unit = { println(1) } // c

def b(): Unit = if (true) { println(1) } /* c */ else { println(2) }
```
