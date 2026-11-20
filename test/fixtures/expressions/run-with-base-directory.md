---
title: Keep a handler call with its run block
description: The Base Directory handler follows the closing brace at both widths. At 60 columns the handler argument wraps.
source: "https://doc.flix.dev/filesystem.html#base-directory"
flix: "0.80"
options: { printWidth: 80 }
---

## Input

```flix
use Fs.FileSystem

def main(): Unit \ { FileSystem, IO } =
    match FileSystem.mkDirs("/tmp/flix-basedir") {
        case Err(err) => println("Setup error: ${err}")
        case Ok(_) =>
            run {
                match FileSystem.write(str = "Hello", "greeting.txt") {
                    case Err(err) => println("Write error: ${err}")
                    case Ok(_) =>
                        match FileSystem.read("greeting.txt") {
                            case Ok(content) => println("Read: ${content}")
                            case Err(err)    => println("Read error: ${err}")
                        }
                }
            } with FileSystem.withBaseDir("/tmp/flix-basedir")
    }
```

## Output

```flix
use Fs.FileSystem

def main(): Unit \ { FileSystem, IO } =
    match FileSystem.mkDirs("/tmp/flix-basedir") {
        case Err(err) => println("Setup error: ${err}")
        case Ok(_)    =>
            run {
                match FileSystem.write(str = "Hello", "greeting.txt") {
                    case Err(err) => println("Write error: ${err}")
                    case Ok(_)    =>
                        match FileSystem.read("greeting.txt") {
                            case Ok(content) => println("Read: ${content}")
                            case Err(err)    => println("Read error: ${err}")
                        }
                }
            } with FileSystem.withBaseDir("/tmp/flix-basedir")
    }
```

```flix printWidth=60
use Fs.FileSystem

def main(): Unit \ { FileSystem, IO } =
    match FileSystem.mkDirs("/tmp/flix-basedir") {
        case Err(err) => println("Setup error: ${err}")
        case Ok(_)    =>
            run {
                match FileSystem.write(
                    str = "Hello",
                    "greeting.txt"
                ) {
                    case Err(err) =>
                        println("Write error: ${err}")
                    case Ok(_)    =>
                        match FileSystem.read(
                            "greeting.txt"
                        ) {
                            case Ok(content) =>
                                println("Read: ${content}")
                            case Err(err)    =>
                                println(
                                    "Read error: ${err}"
                                )
                        }
                }
            } with FileSystem.withBaseDir(
                "/tmp/flix-basedir"
            )
    }
```
