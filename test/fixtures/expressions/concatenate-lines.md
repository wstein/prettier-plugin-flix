---
title: Keep newline separators with the preceding text
description: The formatter keeps each newline separator on the same line as the preceding value when it fits. At a narrower width it uses the individual operator break points.
flix: "0.80"
options: { printWidth: 35 }
---

## Input

```flix
def summary(): String = {
header + "\n" + location + "\n" + verification + "\n" + guide
}
```

## Output

```flix
def summary(): String = {
    header + "\n" +
        location + "\n" +
        verification + "\n" +
        guide
}
```

```flix printWidth=18
def summary(): String = {
    header +
        "\n" +
        location +
        "\n" +
        verification +
        "\n" +
        guide
}
```
