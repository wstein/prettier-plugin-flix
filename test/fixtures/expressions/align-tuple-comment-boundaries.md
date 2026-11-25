---
title: "Align tuple groups through trailing comment width and later blank lines"
description: "An already long line comment can overflow while the padded code fits. A group with a comment ending on its row leaves later groups eligible."
options: { printWidth: 60 }
---

## Input

```flix
def report(): List[(String, Int32)] = List#{
    ("A",1), // primary reference has an unusually long note
    ("Long station",22) // secondary note
}

def notes(): List[(String, Int32)] = List#{
    ("West",3),
    /* Checked by
       afternoon shift. */ ("East Station",125),

    ("South",4),
    ("North",22)
}
```

## Output

```flix
def report(): List[(String, Int32)] = List#{
    ("A",             1),  // primary reference has an unusually long note
    ("Long station", 22)  // secondary note
}

def notes(): List[(String, Int32)] = List#{
    ("West", 3),
    /* Checked by
       afternoon shift. */ ("East Station", 125),

    ("South",  4),
    ("North", 22)
}
```

```flix printWidth=100
def report(): List[(String, Int32)] = List#{
    ("A",             1),  // primary reference has an unusually long note
    ("Long station", 22)   // secondary note
}

def notes(): List[(String, Int32)] = List#{
    ("West", 3),
    /* Checked by
       afternoon shift. */ ("East Station", 125),

    ("South",  4),
    ("North", 22)
}
```
