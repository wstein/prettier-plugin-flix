---
title: "Align map and record rows at the exact fit boundary"
description: "At 41 columns the padded rows fit, including the comma. At 40 columns the two groups use ordinary spacing."
options: { printWidth: 41 }
---

## Input

```flix
def recordFit(): {x = String, description = String} = {
    x = "12345678901234567890",
    description = "short"
}

def mapFit(): Map[String, String] = Map#{
    "x" => "123456789012345",
    "longFieldName" => "short"
}
```

## Output

```flix
def recordFit(): {
    x = String,
    description = String
} = {
    x           = "12345678901234567890",
    description = "short"
}

def mapFit(): Map[String, String] = Map#{
    "x"             => "123456789012345",
    "longFieldName" => "short"
}
```

```flix printWidth=40
def recordFit(): {
    x = String,
    description = String
} = {
    x = "12345678901234567890",
    description = "short"
}

def mapFit(): Map[
    String,
    String
] = Map#{
    "x" => "123456789012345",
    "longFieldName" => "short"
}
```
