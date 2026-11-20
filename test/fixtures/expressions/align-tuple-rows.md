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
("A",8), // Platform number
("Library",126)
} @ r

def commented():Vector[(String,Int32,String)]=Vector#{
("Museum",8,"Central"), // The first leg.
("Park",126,"Airport")
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

def inRegion(r: Region[a]): Array[
    (String, Int32),
    a
] \ a = Array#{
    ("A",         8),  // Platform number
    ("Library", 126)
} @ r

def commented(): Vector[(String, Int32, String)] = Vector#{
    ("Museum",   8, "Central"),  // The first leg.
    ("Park",   126, "Airport")
}
```

```flix printWidth=48
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
    Array[(String, Int32), a] \ a = Array#{
    ("A",         8),  // Platform number
    ("Library", 126)
} @ r

def commented():
    Vector[(String, Int32, String)] = Vector#{
    ("Museum", 8, "Central"),  // The first leg.
    ("Park", 126, "Airport")
}
```
