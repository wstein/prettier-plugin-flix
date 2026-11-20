---
title: "Wrap a call before an oversized trailing lambda"
description: "A trailing block-bodied lambda stays on the call line only when the call prefix fits."
flix: "0.80"
---

## Input

```flix
def demo(): Unit = veryLongOperationNameWithCallback(anotherLongArgumentThatCanMove, message -> {
    println(message);
    println(message)
})
```

## Output

```flix
def demo(): Unit = veryLongOperationNameWithCallback(
    anotherLongArgumentThatCanMove,
    message -> {
        println(message);
        println(message)
    }
)
```

```flix printWidth=100
def demo(): Unit = veryLongOperationNameWithCallback(anotherLongArgumentThatCanMove, message -> {
    println(message);
    println(message)
})
```
