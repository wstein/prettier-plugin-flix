---
title: "Preserve spacing across access dots with or without comments"
description: "The first own-line comment drives the break even when an inline block comment follows. A bare access dot keeps its separating space."
group: "Calls and function signatures"
options: { printWidth: 40 }
---

## Input

```flix
mod BlockComment {
    def wait(c: Chan, d: Deadline): Unit \ { Chan, NonDet } = match some.
        /* keep */
        long(argumentOne, argumentTwo) {
        case _ => ()
    }
}

mod MixedComments {
    def wait(c: Chan, d: Deadline): Unit \ { Chan, NonDet } = match some.
        /* first */ /* inline */ long(argumentOne, argumentTwo) {
        case _ => ()
    }
}

def access() = x.
    f(a, b)
```

## Output

```flix
mod BlockComment {
    def wait(c: Chan, d: Deadline): Unit
        \ { Chan, NonDet } = match some.
    /* keep */
    long(argumentOne, argumentTwo) {
        case _ => ()
    }
}

mod MixedComments {
    def wait(c: Chan, d: Deadline): Unit
        \ { Chan, NonDet } = match some.
    /* first */ /* inline */ long(
        argumentOne,
        argumentTwo
    ) {
        case _ => ()
    }
}

def access() = x. f(a, b)
```
