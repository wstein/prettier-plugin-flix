---
title: Keep blanks around decorative section dividers
description: "A `//` line of only dashes, equals or stars is a section separator: force a blank line above and below. Plain `//` headers and Flixdoc keep their own rules."
group: "Line endings and comment placement"
flix: "0.80"
---

## Input

```flix
val a: Int32 = 3;
// -------------------------
val d: Int32 = 55;

val e: Int32 = 1
// =========================
val f: Int32 = 2

/// Still attached Flixdoc.

def documented(): Int32 = 0

// A plain header may keep its blank line.

def plain(): Int32 = 0
```

## Output

```flix
val a: Int32 = 3;

// -------------------------

val d: Int32 = 55;

val e: Int32 = 1

// =========================

val f: Int32 = 2

/// Still attached Flixdoc.
def documented(): Int32 = 0

// A plain header may keep its blank line.

def plain(): Int32 = 0
```
