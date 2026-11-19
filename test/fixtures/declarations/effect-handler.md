---
title: "Effect declaration and handler"
description: "An effect operation appears in a declaration, an annotated test, and a handler with a continuation."
flix: "0.80"
---

## Input

```flix
eff Ask{
def ask():Int32
}
@Test
def testAsk():Unit \ Assert={
let value=run {Ask.ask()} with handler Ask {
def ask(k)=k(42)
};
Assert.assertEq(expected=42,value)
}
```

## Output

```flix
eff Ask {
    def ask(): Int32
}
@Test
def testAsk(): Unit \ Assert = {
    let value = run { Ask.ask() }
        with handler Ask {
            def ask(k) = k(42)
        };
    Assert.assertEq(expected = 42, value)
}
```
