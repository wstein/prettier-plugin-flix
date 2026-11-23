---
title: "Comment-only collection and record braces stay tight"
description: "A single comment inside `List#{}`, `Array#{}`, or a record does not invent a blank line after `{`. A blank line already present in the source stays."
group: "Alignment"
minVersion: "0.80.0"
options: { printWidth: 80 }
---

## Input

```flix
def lists(): Unit =
    discard List#{ /* c */ };
    discard List#{

        /* gap */
    }

def arrays(rc: Region[r]): Unit \ r =
    discard Array#{ /* c */ } @ rc;
    discard Array#{

        /* gap */
    } @ rc

def records(): Unit =
    discard { /* c */ };
    discard {

        /* gap */
    }
```

## Output

```flix
def lists(): Unit =
    discard List#{
        /* c */
    };
    discard List#{

        /* gap */
    }

def arrays(rc: Region[r]): Unit \ r =
    discard Array#{
        /* c */
    } @ rc;
    discard Array#{

        /* gap */
    } @ rc

def records(): Unit =
    discard {
        /* c */
    };
    discard {

        /* gap */
    }
```

```flix printWidth=40
def lists(): Unit =
    discard List#{
        /* c */
    };
    discard List#{

        /* gap */
    }

def arrays(rc: Region[r]): Unit \ r =
    discard Array#{
        /* c */
    } @ rc;
    discard Array#{

        /* gap */
    } @ rc

def records(): Unit =
    discard {
        /* c */
    };
    discard {

        /* gap */
    }
```
