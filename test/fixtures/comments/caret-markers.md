---
title: Keep standalone carets under their code
description: "A standalone caret annotation follows the token it marks, including when a signature wraps. Ordinary comments use the surrounding indentation."
group: "Line endings and comment placement"
source: "https://github.com/flix/book/blob/64d81bd6984ede06442ef7b63235092b9fe3c29c/src/effect-polymorphism.md#L10"
---

## Input

```flix
def inc(x: Int32): Int32 \ {} = x + 1
                        // ^^ empty effect set

def total(first: Int32, secondArgument: Int32): Int32 = first + secondArgument
       // ^^^^^ first input
```

## Output

```flix
def inc(x: Int32): Int32 \ {} = x + 1
                        // ^^ empty effect set

def total(first: Int32, secondArgument: Int32): Int32 = first + secondArgument
       // ^^^^^ first input
```

```flix printWidth=40
def inc(x: Int32): Int32 \ {} = x + 1
                        // ^^ empty effect set

def total(
    first: Int32,
 // ^^^^^ first input
    secondArgument: Int32
): Int32 = first + secondArgument
```

```flix printWidth=60
def inc(x: Int32): Int32 \ {} = x + 1
                        // ^^ empty effect set

def total(first: Int32, secondArgument: Int32): Int32 =
       // ^^^^^ first input
    first + secondArgument
```
