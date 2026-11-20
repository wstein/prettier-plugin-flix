---
title: Align numeric, regex, null and interpolated tuple cells
description: "Decimal points align vertically. Regexes, null and strings containing interpolations can also be table cells."
flix: "0.80"
options: { printWidth: 60 }
---

## Input

```flix
def timetable(): Vector[(String, Float64, String)] = Vector#{
    ("Museum", 8.0, "Central"),
    ("Central", 7.0, "Library"),
    ("Central", 45.6, "Airport"), // This leg exceeds the short-trip limit.
    ("Library", 6.77, "Park"),
    ("Park", 9.89, "Museum")
}

def readings(): List[(Float32, BigDecimal)] = List#{
    (-8.0f32, 5.00ff),
    (6e2f32, -125.6ff)
}

def filters(): Vector[(Regex, Bool)] = Vector#{
    (regex"^A", true),
    (regex"^North, West$", false)
}

def labels(n: Int32): Vector[(String, String)] = Vector#{
    ("${String.take(2,"West")}", "Station"),
    ("Stop ${n}", "North"),
    ("Unknown", "South")
}

def missing(): Vector[(String, Null, Int32)] = Vector#{
    ("A", null, 1),
    ("Library", null, 20)
}

def nested(): Vector[(String, (Int32, Int32))] = Vector#{
    ("A long station name", (1, 22)),
    ("A longer terminal name", (15, 4))
}

def routes(): Vector[(String, Vector[Int32], Bool)] = Vector#{
    ("A", Vector#{1,22}, true),
    ("Library", Vector#{15,4,2}, false)
}
```

## Output

```flix
def timetable(): Vector[
    (String, Float64, String)
] = Vector#{
    ("Museum",   8.0,  "Central"),
    ("Central",  7.0,  "Library"),
    ("Central", 45.6,  "Airport"),  // This leg exceeds the short-trip limit.
    ("Library",  6.77, "Park"),
    ("Park",     9.89, "Museum")
}

def readings(): List[(Float32, BigDecimal)] = List#{
    (-8.0f32,    5.00ff),
    ( 6e2f32, -125.6ff)
}

def filters(): Vector[(Regex, Bool)] = Vector#{
    (regex"^A",            true),
    (regex"^North, West$", false)
}

def labels(n: Int32): Vector[(String, String)] = Vector#{
    ("${String.take(2, "West")}", "Station"),
    ("Stop ${n}",                 "North"),
    ("Unknown",                   "South")
}

def missing(): Vector[(String, Null, Int32)] = Vector#{
    ("A",       null,  1),
    ("Library", null, 20)
}

def nested(): Vector[(String, (Int32, Int32))] = Vector#{
    ("A long station name",    (1, 22)),
    ("A longer terminal name", (15, 4))
}

def routes(): Vector[
    (String, Vector[Int32], Bool)
] = Vector#{
    ("A",       Vector#{1, 22},    true),
    ("Library", Vector#{15, 4, 2}, false)
}
```
