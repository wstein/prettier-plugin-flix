---
title: "Count a lead block comment on `=` when aligning schema rows"
description: "Schema row alignment reserves the same equals trailer as signatures, including a block comment between the closing brace and `=`. Width 43 stays vertically broken; 83 keeps row alignment."
group: "Calls and function signatures"
options: { printWidth: 43 }
---

## Input

```flix
def f(): #{ Edge(Int32, Int32), Path(Int32, Int32), Node(Int32) } /* comment */ = #{ Node(1). }
```

## Output

```flix
def f(): #{
    Edge(Int32, Int32),
    Path(Int32, Int32),
    Node(Int32)
} /* comment */ = #{ Node(1). }
```

```flix printWidth=83
def f(): #{ Edge(Int32, Int32),
            Path(Int32, Int32),
            Node(Int32) } /* comment */ = #{ Node(1). }
```
