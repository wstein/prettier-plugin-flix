---
title: Code after a line comment starts on a new line
flix: "0.80"
---

## Input

```flix
def f(): Int32 =
    run {
        Tell.tell(1); // c
        Ask.ask()
    } with handler Ask { def ask(k) = k(1) } // c
    with handler Tell { // c
        def tell(_x, k) = k() // t
    }
```

## Output

```flix
def f(): Int32 =
    run {
        Tell.tell(1); // c
        Ask.ask()
    } with handler Ask { def ask(k) = k(1) } // c
    with handler Tell { // c
        def tell(_x, k) = k() // t
    }
```
