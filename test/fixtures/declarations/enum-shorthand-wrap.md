---
title: Indent continuation variants in enum shorthand
description: "A short group fits on one line. Wrapped variants belong to the same case entry."
flix: "0.80"
---

## Input

```flix
enum Weekday {
    case Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
    case Holiday
}
```

## Output

```flix
enum Weekday {
    case Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
    case Holiday
}
```

```flix printWidth=45
enum Weekday {
    case Monday,
        Tuesday,
        Wednesday,
        Thursday,
        Friday,
        Saturday,
        Sunday
    case Holiday
}
```
