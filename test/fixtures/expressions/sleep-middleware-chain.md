---
title: Align Sleep middleware with the first handler
description: The first handler follows the closing brace when it fits. The logging handler starts beneath its with keyword.
flix: "0.80"
source: "https://github.com/flix/book/blob/64d81bd6984ede06442ef7b63235092b9fe3c29c/src/sleep.md#L76"
options: { printWidth: 80 }
---

## Input

```flix
use Time.Duration.{milliseconds, seconds}
use Time.Sleep

def main(): Unit \ { Logger, Sleep, IO } =
    run {
        println("Sleeping for 2 seconds (capped to 500ms)...");
        Sleep.sleep(seconds(2));
        println("Done!")
    } with Sleep.withMaxSleep(milliseconds(500))
      with Sleep.withLogging
```

## Output

```flix
use Time.Duration.{milliseconds, seconds}
use Time.Sleep

def main(): Unit \ { Logger, Sleep, IO } =
    run {
        println("Sleeping for 2 seconds (capped to 500ms)...");
        Sleep.sleep(seconds(2));
        println("Done!")
    } with Sleep.withMaxSleep(milliseconds(500))
      with Sleep.withLogging
```

```flix printWidth=39
use Time.Duration.{
    milliseconds,
    seconds
}
use Time.Sleep

def main(): Unit
    \ { Logger, Sleep, IO } =
    run {
        println(
            "Sleeping for 2 seconds (capped to 500ms)..."
        );
        Sleep.sleep(seconds(2));
        println("Done!")
    }
    with Sleep.withMaxSleep(
        milliseconds(500)
    )
    with Sleep.withLogging
```
