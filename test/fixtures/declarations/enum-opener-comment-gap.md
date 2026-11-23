---
title: "Keep a blank line after an enum opening-brace comment"
description: "A blank line after an enum opening-brace comment separates it from the case or comment that follows."
group: "Declarations"
flix: "0.80"
options: { printWidth: 80 }
---

## Input

```flix
enum Color { // Available colors.

    case Red
}
enum Quiet { // An empty enum.

    /* Reserved. */
}
enum Mixed { /* First. */ // Second.

    case Blue
}
enum Tight { // No gap.
    case Green
}
enum BlockGap { /* A block comment. */

    case Orange
}
mod Ordinary { // Module header.

    pub def f(): Unit = ()
}
```

## Output

```flix
enum Color {
    // Available colors.

    case Red
}
enum Quiet {
    // An empty enum.

    /* Reserved. */
}
enum Mixed {
    /* First. */ // Second.

    case Blue
}
enum Tight {  // No gap.
    case Green
}
enum BlockGap { /* A block comment. */
    case Orange
}
mod Ordinary {  // Module header.

    pub def f(): Unit = ()
}
```

```flix printWidth=40
enum Color {
    // Available colors.

    case Red
}
enum Quiet {
    // An empty enum.

    /* Reserved. */
}
enum Mixed {
    /* First. */ // Second.

    case Blue
}
enum Tight {  // No gap.
    case Green
}
enum BlockGap { /* A block comment. */
    case Orange
}
mod Ordinary {  // Module header.

    pub def f(): Unit = ()
}
```
