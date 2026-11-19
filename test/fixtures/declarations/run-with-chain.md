---
title: "Place with clauses at the level of run"
description: "A single handler call can follow the closing brace when it fits. In a chain, each with starts on its own line at the same level as run."
flix: "0.80"
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
    run f()
    with handler Ask { def ask(k) = k(fallback) }

def withoutLogging(f: Unit -> Int32 \ ef): Int32 \ ef - Log =
    run f()
    with handler Log { def log(_message, k) = k() }

def readWithLog(): Int32 =
    run {
        Log.log("Reading a value");
        Ask.ask()
    }
    with withFallback(Int32.max(100, 200))
    with withoutLogging
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
    }
    with withFallback(
        Int32.max(100, 200)
    )
    with withoutLogging
```
