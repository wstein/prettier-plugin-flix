---
title: "Keep method dots attached in long calls"
description: "A long method chain can wrap inside argument lists while its method dots stay tight."
flix: "0.80"
options: { printWidth: 60 }
---

## Input

```flix
def normalize(input: String): String =
    input.trim().toLowerCase().replace("station", "stop").substring(0)

def compact(input: String): String =
    input.trim().toLowerCase()

def chained(input: String): String \ IO =
    input.trim().toLowerCase().strip().stripLeading().stripTrailing().toUpperCase().trim()
```

## Output

```flix
def normalize(input: String): String =
    input.trim().toLowerCase().replace(
        "station",
        "stop"
    ).substring(0)

def compact(input: String): String =
    input.trim().toLowerCase()

def chained(input: String): String \ IO =
    input.trim().toLowerCase().strip().stripLeading().stripTrailing().toUpperCase().trim()
```

```flix printWidth=100
def normalize(input: String): String =
    input.trim().toLowerCase().replace("station", "stop").substring(0)

def compact(input: String): String = input.trim().toLowerCase()

def chained(input: String): String \ IO =
    input.trim().toLowerCase().strip().stripLeading().stripTrailing().toUpperCase().trim()
```
