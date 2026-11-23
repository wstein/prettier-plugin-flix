---
title: "Align chained handlers with the first with"
description: "The first with stays after the closing brace even when its call arguments wrap. Further clauses align with the first with. One short unbraced run can stay compact. Wrapped clauses start at the level of run."
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Exp.RunWith.flix#L284"
---

## Input

```flix
eff Ask {
    def ask(): Int32
}

eff Log {
    def log(message: String): Unit
}

def withFallback(fallback: Int32, f: Unit -> Int32 \ ef): Int32 \ ef - Ask =
    run f() with handler Ask { def ask(k) = k(fallback) }

def withoutLogging(f: Unit -> Int32 \ ef): Int32 \ ef - Log =
    run f() with handler Log { def log(_message, k) = k() }

def readWithLog(): Int32 =
    run {
        Log.log("Reading a value");
        Ask.ask()
    } with withFallback(Int32.max(100, 200)) with withoutLogging

def withLabeledFallback(_label: String, fallback: Int32, f: Unit -> Int32 \ ef): Int32 \ ef - Ask =
    run f() with handler Ask { def ask(k) = k(fallback) }

def readWithLabel(): Int32 =
    run {
        Ask.ask()
    } with withLabeledFallback("request", Int32.max(100, 200))

def readWithComment(): Int32 =
    run {
        Ask.ask()
    } with withFallback(
        Int32.max(100, 200) // Use the larger default
    )
```

## Output

```flix
eff Ask {
    def ask(): Int32
}

eff Log {
    def log(message: String): Unit
}

def withFallback(fallback: Int32, f: Unit -> Int32 \ ef): Int32 \ ef - Ask =
    run f() with handler Ask { def ask(k) = k(fallback) }

def withoutLogging(f: Unit -> Int32 \ ef): Int32 \ ef - Log =
    run f() with handler Log { def log(_message, k) = k() }

def readWithLog(): Int32 =
    run {
        Log.log("Reading a value");
        Ask.ask()
    } with withFallback(Int32.max(100, 200))
      with withoutLogging

def withLabeledFallback(_label: String, fallback: Int32, f: Unit -> Int32 \ ef):
    Int32 \ ef - Ask = run f() with handler Ask { def ask(k) = k(fallback) }

def readWithLabel(): Int32 =
    run {
        Ask.ask()
    } with withLabeledFallback("request", Int32.max(100, 200))

def readWithComment(): Int32 =
    run {
        Ask.ask()
    } with withFallback(
        Int32.max(100, 200)  // Use the larger default
    )
```

```flix printWidth=37
eff Ask {
    def ask(): Int32
}

eff Log {
    def log(message: String): Unit
}

def withFallback(
    fallback: Int32,
    f: Unit -> Int32 \ ef
): Int32 \ ef - Ask =
    run f()
    with handler Ask {
        def ask(k) = k(fallback)
    }

def withoutLogging(
    f: Unit -> Int32 \ ef
): Int32 \ ef - Log =
    run f()
    with handler Log {
        def log(_message, k) = k()
    }

def readWithLog(): Int32 =
    run {
        Log.log("Reading a value");
        Ask.ask()
    } with withFallback(
        Int32.max(100, 200))
      with withoutLogging

def withLabeledFallback(
    _label: String,
    fallback: Int32,
    f: Unit -> Int32 \ ef
): Int32 \ ef - Ask =
    run f()
    with handler Ask {
        def ask(k) = k(fallback)
    }

def readWithLabel(): Int32 =
    run {
        Ask.ask()
    } with withLabeledFallback(
        "request",
        Int32.max(100, 200)
    )

def readWithComment(): Int32 =
    run {
        Ask.ask()
    } with withFallback(
        Int32.max(100, 200)  // Use the larger default
    )
```
