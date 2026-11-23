---
title: "Align map arrows when a block comment leads an entry"
description: "A block comment before a map key must not change arrow alignment between passes, whether it sits after the opener or between entries."
group: "Line endings and comment placement"
options: { printWidth: 40 }
---

## Input

```flix
def counts(): Map[Int32, Int32] = Map#{ /* note */ 1=>2,200=>3,4000=>4}

def mid(): Map[Int32, Int32] = Map#{1=>2, /* note */ 200=>3,4000=>4}
```

## Output

```flix
def counts(): Map[Int32, Int32] = Map#{
    /* note */ 1    => 2,
    200  => 3,
    4000 => 4
}

def mid(): Map[Int32, Int32] = Map#{
    1 => 2,
    /* note */ 200  => 3,
    4000 => 4
}
```

```flix printWidth=60
def counts(): Map[Int32, Int32] = Map#{
    /* note */ 1    => 2,
    200  => 3,
    4000 => 4
}

def mid(): Map[Int32, Int32] = Map#{
    1 => 2,
    /* note */ 200  => 3,
    4000 => 4
}
```

```flix printWidth=100
def counts(): Map[Int32, Int32] = Map#{/* note */ 1 => 2, 200 => 3, 4000 => 4}

def mid(): Map[Int32, Int32] = Map#{1 => 2, /* note */ 200 => 3, 4000 => 4}
```
