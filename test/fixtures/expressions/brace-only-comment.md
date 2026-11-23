---
title: "Comment-only collection and record braces stay tight"
description: "A comment inside `List#{}`, `Array#{}`, `Set#{}`, `Map#{}`, `Vector#{}`, a record, `#{…}`, or `(…)` does not invent a blank line after the opener. Expression and schema braces and parameter lists also drop a source blank there, matching flix format 0.80.0; declaration braces still keep one."
group: "Other constructs"
minVersion: "0.80.0"
options: { printWidth: 80 }
---

## Input

```flix
def lists(): Unit =
    discard List#{ /* c */ };
    discard List#{

        /* gap */
    };
    discard List#{ /* a */ /* b */ };
    discard List#{
        // a

        // b
    }

def arrays(rc: Region[r]): Unit \ r =
    discard Array#{ /* c */ } @ rc;
    discard Array#{

        /* gap */
    } @ rc

def sets(): Unit =
    discard Set#{ /* c */ }

def maps(): Unit =
    discard Map#{ /* c */ }

def vectors(): Unit =
    discard Vector#{ /* c */ }

def records(): Unit =
    discard { /* c */ };
    discard {

        /* gap */
    }

def schemas(): Unit =
    discard #{ /* c */ };
    discard #{

        /* gap */
    }

type alias SchemaGap = #{

    /* gap */
}

def params(
    // c
): Unit = ()

def paramsGap(

    /* gap */
): Unit = ()
```

## Output

```flix
def lists(): Unit =
    discard List#{
        /* c */
    };
    discard List#{
        /* gap */
    };
    discard List#{
        /* a */
        /* b */
    };
    discard List#{
        // a

        // b
    }

def arrays(rc: Region[r]): Unit \ r =
    discard Array#{
        /* c */
    } @ rc;
    discard Array#{
        /* gap */
    } @ rc

def sets(): Unit =
    discard Set#{
        /* c */
    }

def maps(): Unit =
    discard Map#{
        /* c */
    }

def vectors(): Unit =
    discard Vector#{
        /* c */
    }

def records(): Unit =
    discard {
        /* c */
    };
    discard {
        /* gap */
    }

def schemas(): Unit =
    discard #{
        /* c */
    };
    discard #{
        /* gap */
    }

type alias SchemaGap = #{
    /* gap */
}

def params(
    // c
): Unit = ()

def paramsGap(
    /* gap */
): Unit = ()
```

```flix printWidth=40
def lists(): Unit =
    discard List#{
        /* c */
    };
    discard List#{
        /* gap */
    };
    discard List#{
        /* a */
        /* b */
    };
    discard List#{
        // a

        // b
    }

def arrays(rc: Region[r]): Unit \ r =
    discard Array#{
        /* c */
    } @ rc;
    discard Array#{
        /* gap */
    } @ rc

def sets(): Unit =
    discard Set#{
        /* c */
    }

def maps(): Unit =
    discard Map#{
        /* c */
    }

def vectors(): Unit =
    discard Vector#{
        /* c */
    }

def records(): Unit =
    discard {
        /* c */
    };
    discard {
        /* gap */
    }

def schemas(): Unit =
    discard #{
        /* c */
    };
    discard #{
        /* gap */
    }

type alias SchemaGap = #{
    /* gap */
}

def params(
    // c
): Unit = ()

def paramsGap(
    /* gap */
): Unit = ()
```
