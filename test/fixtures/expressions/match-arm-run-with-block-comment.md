---
title: "Run-with after a block comment in a multi-statement match arm"
description: "The handler of a run block that ends in a block comment keeps its closing parenthesis on its own line when the match arm is measured for arrow alignment."
group: "Line endings and comment placement"
options: { printWidth: 60 }
---

## Input

```flix
def main(): Unit \ IO =
    match 1 {
        case 1 =>
            println("a");
            run {
                println("b")
            } /* c */
            with Handler(someLongFunctionName(argumentNumberOne, argumentNumberTwo))
        case _ => ()
    }
```

## Output

```flix
def main(): Unit \ IO =
    match 1 {
        case 1 =>
            println("a");
            run {
                println("b")
            } /* c */
            with Handler(
                someLongFunctionName(
                    argumentNumberOne,
                    argumentNumberTwo
                )
            )
        case _ => ()
    }
```
