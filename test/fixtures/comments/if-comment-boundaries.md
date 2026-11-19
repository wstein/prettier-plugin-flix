---
title: Line comments after the condition, before else and after else keep their place
flix: "0.80"
---

## Input

```flix
def afterCondition(): Int32 = if (true) // note
    { 1 } else { 2 }

def beforeElse(): Int32 = if (true) { 1 } // note
    else { 2 }

def afterElse(): Int32 = if (true) { 1 } else // note
    { 2 }

def noBlocks(): Int32 = if // note
    (true) 1 /* c */ else 2
```

## Output

```flix
def afterCondition(): Int32 = if (true) // note
    { 1 } else { 2 }

def beforeElse(): Int32 = if (true) { 1 } // note
else { 2 }

def afterElse(): Int32 = if (true) { 1 } else // note
    { 2 }

def noBlocks(): Int32 = if // note
    (true)
    1
/* c */ else
    2
```
