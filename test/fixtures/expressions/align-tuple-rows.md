---
title: "Align columns in multiline collections of literal tuples"
description: "Text uses display width, integers align on the right, and a trailing comment counts toward the available width."
flix: "0.80"
options: { printWidth: 60 }
---

## Input

```flix
def stops():List[(String,Int32,String)]=List#{
("🚉",-8,"North"),
("Library",126,"West")
}

def counts():Set[(String,Int32)]=Set#{("A",8),("Library",126)}

def compact():Set[(Int32,Int32)]=Set#{(1,2),(30,4)}

def inRegion(r:Region[a]):Array[(String,Int32),a] \ a = Array#{
("Central Station",8),
("Library",126),
("Park Station",1200)
} @ r

def commented():Vector[(String,Int32,String)]=Vector#{
("Park",126,"Airport"),
("Museum",8,"Central") // The first leg.
}
```

## Output

```flix
def stops(): List[(String, Int32, String)] = List#{
    ("🚉",       -8, "North"),
    ("Library", 126, "West")
}

def counts(): Set[(String, Int32)] = Set#{
    ("A",         8),
    ("Library", 126)
}

def compact(): Set[(Int32, Int32)] = Set#{(1, 2), (30, 4)}

def inRegion(r: Region[a]): Array[(String, Int32), a] \ a =
    Array#{
        ("Central Station",    8),
        ("Library",          126),
        ("Park Station",    1200)
    } @ r

def commented(): Vector[(String, Int32, String)] = Vector#{
    ("Park",   126, "Airport"),
    ("Museum",   8, "Central")  // The first leg.
}
```

```flix printWidth=47
def stops(): List[
    (String, Int32, String)
] = List#{
    ("🚉",       -8, "North"),
    ("Library", 126, "West")
}

def counts(): Set[(String, Int32)] = Set#{
    ("A",         8),
    ("Library", 126)
}

def compact(): Set[(Int32, Int32)] = Set#{
    ( 1, 2),
    (30, 4)
}

def inRegion(r: Region[a]):
    Array[(String, Int32), a] \ a =
    Array#{
        ("Central Station",    8),
        ("Library",          126),
        ("Park Station",    1200)
    } @ r

def commented():
    Vector[(String, Int32, String)] = Vector#{
    ("Park", 126, "Airport"),
    ("Museum", 8, "Central")  // The first leg.
}
```
