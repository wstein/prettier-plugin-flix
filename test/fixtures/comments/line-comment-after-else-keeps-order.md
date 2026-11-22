---
title: A line comment after else stays in front of the comments in the else branch
description: "The comment after else is deferred to the end of the line, so a later block comment in the branch must not end up in front of it. The branch starts on its own line."
group: "Calls, blocks, and control flow"
flix: "0.80"
---

## Input

```flix
def inline(): Int32 = if (true) 1 else // note
    x /* B */

def inner(): Int32 = if (true) 1 else // note
    g(x /* B */, y)

def afterBlock(): Int32 = if (true) { 1 } else // note
    x /* B */

def alone(): Int32 = if (true) 1 else // note
    x

def blockOnly(): Int32 = if (true) 1 else
    x /* B */
```

## Output

```flix
def inline(): Int32 = if (true)
    1
else  // note
    x /* B */

def inner(): Int32 = if (true)
    1
else  // note
    g(x /* B */, y)

def afterBlock(): Int32 = if (true) { 1 } else  // note
    x /* B */

def alone(): Int32 = if (true) 1 else x  // note

def blockOnly(): Int32 = if (true) 1 else x /* B */
```

```flix printWidth=40
def inline(): Int32 = if (true)
    1
else  // note
    x /* B */

def inner(): Int32 = if (true)
    1
else  // note
    g(x /* B */, y)

def afterBlock(): Int32 = if (true) {
    1
} else  // note
    x /* B */

def alone(): Int32 = if (true) 1 else x  // note

def blockOnly(): Int32 =
    if (true) 1 else x /* B */
```

```flix printWidth=60
def inline(): Int32 = if (true)
    1
else  // note
    x /* B */

def inner(): Int32 = if (true)
    1
else  // note
    g(x /* B */, y)

def afterBlock(): Int32 = if (true) { 1 } else  // note
    x /* B */

def alone(): Int32 = if (true) 1 else x  // note

def blockOnly(): Int32 = if (true) 1 else x /* B */
```

```flix printWidth=100
def inline(): Int32 = if (true)
    1
else  // note
    x /* B */

def inner(): Int32 = if (true)
    1
else  // note
    g(x /* B */, y)

def afterBlock(): Int32 = if (true) { 1 } else  // note
    x /* B */

def alone(): Int32 = if (true) 1 else x  // note

def blockOnly(): Int32 = if (true) 1 else x /* B */
```
