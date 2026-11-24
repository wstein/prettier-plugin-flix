---
title: "Align tuple rows after leading comments"
description: "A comment before the first tuple does not prevent column alignment, and block comments between rows stay above their tuple."
---

## Input

```flix
def counts(): List[(String, Int32)] = List#{
    /* Manual station counts. */
    // Early counts.
    ("West", 3),
    /* Checked by the
       afternoon shift. */
    ("East Station", 125),


    ("South", 4),
    ("North", 22)
}
```

## Output

```flix
def counts(): List[(String, Int32)] = List#{
    /* Manual station counts. */
    // Early counts.
    ("West",           3),
    /* Checked by the
       afternoon shift. */
    ("East Station", 125),

    ("South",  4),
    ("North", 22)
}
```
