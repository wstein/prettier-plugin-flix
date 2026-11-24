---
title: "Align tuple rows by blank-line group"
description: "A blank line separates tables. Comments directly above a row stay with it and share its table."
options: { printWidth: 60 }
---

## Input

```flix
def timetable(): Vector[(String, Int32, String)] = Vector#{
    ("Museum", 8, "Central"),
    ("Central", 7, "Library"),



    // This leg exceeds the short-trip limit.
    ("Central", 45, "Airport"),
    // Next stop.
    ("Library", 6, "Park"),
    ("Park", 9, "Museum")
}

def limits(): Set[(String, Int32)] = Set#{
    ("Central interchange station", 1),
    ("A", 1234567),

    ("South", 4),
    ("North", 22)
}

def plain(): List[Int32] = List#{
    (1 + 2),

    (3 + 4)
}

def commentEndsOnRow(): List[(String, Int32)] = List#{
    ("West", 3),
    /* Checked by
       afternoon shift. */ ("East Station", 125),
    ("South", 4),
    ("North", 22)
}
```

## Output

```flix
def timetable(): Vector[(String, Int32, String)] = Vector#{
    ("Museum",  8, "Central"),
    ("Central", 7, "Library"),

    // This leg exceeds the short-trip limit.
    ("Central", 45, "Airport"),
    // Next stop.
    ("Library",  6, "Park"),
    ("Park",     9, "Museum")
}

def limits(): Set[(String, Int32)] = Set#{
    ("Central interchange station",       1),
    ("A",                           1234567),

    ("South",  4),
    ("North", 22)
}

def plain(): List[Int32] = List#{(1 + 2), (3 + 4)}

def commentEndsOnRow(): List[(String, Int32)] = List#{
    ("West", 3),
    /* Checked by
       afternoon shift. */ ("East Station", 125),
    ("South", 4),
    ("North", 22)
}
```

```flix printWidth=40
def timetable():
    Vector[
        (String, Int32, String)
    ] = Vector#{
    ("Museum",  8, "Central"),
    ("Central", 7, "Library"),

    // This leg exceeds the short-trip limit.
    ("Central", 45, "Airport"),
    // Next stop.
    ("Library",  6, "Park"),
    ("Park",     9, "Museum")
}

def limits(): Set[
    (String, Int32)
] = Set#{
    ("Central interchange station", 1),
    ("A", 1234567),

    ("South",  4),
    ("North", 22)
}

def plain(): List[Int32] = List#{
    (1 + 2),
    (3 + 4)
}

def commentEndsOnRow():
    List[(String, Int32)] = List#{
    ("West", 3),
    /* Checked by
       afternoon shift. */ (
        "East Station",
        125
    ),
    ("South", 4),
    ("North", 22)
}
```
