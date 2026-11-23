---
title: Indented comment continuations after a comma
description: "Source indentation distinguishes a continuation from a comment on the next item."
group: "Line endings and comment placement"
---

## Input

```flix
def a(): Unit = g(
    1,  // after the comma this is a pretty long comment saying
       // needing a second line...
          // and a third line
    // comment on the lambda
    x -> { println(x) }
)

def b(): Unit = g(
    100, // comment on 100
    // comment on 2
    2
)

def c(): Unit = g(
    1, // comment on 1

        // comment on 2
    2
)

def d(): Unit = g(1, // comment on 1
    // comment on 2
    2
)
```

## Output

```flix
def a(): Unit = g(
    1,  // after the comma this is a pretty long comment saying
        // needing a second line...
        // and a third line
    // comment on the lambda
    x -> { println(x) }
)

def b(): Unit = g(
    100,  // comment on 100
    // comment on 2
    2
)

def c(): Unit = g(
    1,  // comment on 1
    // comment on 2
    2
)

def d(): Unit = g(
    1,  // comment on 1
    // comment on 2
    2
)
```
