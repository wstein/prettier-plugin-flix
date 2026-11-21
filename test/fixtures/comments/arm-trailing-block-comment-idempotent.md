---
title: "Keep a block comment that ends the line after => on its own break across passes"
description: "Match-arm alignment softens trailing block-comment breaks only while measuring arrow columns, so the printed arm still breaks after a block comment that ends its line."
group: "Line endings and comment placement"
flix: "0.80"
options: { printWidth: 44 }
---

## Input

```flix
def describeConnection(connection: Option[Int32]): Int32 = match connection {
    case Some(platformNumber) => /* the platform */
        platformNumber
    case None => 0
}
```

## Output

```flix
def describeConnection(
    connection: Option[Int32]
): Int32 = match connection {
    case Some(
        platformNumber
    ) => /* the platform */
        platformNumber
    case None                 => 0
}
```

```flix printWidth=100
def describeConnection(connection: Option[Int32]): Int32 = match connection {
    case Some(platformNumber) => /* the platform */
        platformNumber
    case None                 => 0
}
```
