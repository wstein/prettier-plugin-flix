---
title: "A Java import and JVM calls"
description: "Keep the dotted Java name tight and format the constructor and method call as distinct operations."
---

## Input

```flix
import java.lang.StringBuilder
pub def render():String \ IO=new StringBuilder().append("Flix").toString()
```

## Output

```flix
import java.lang.StringBuilder
pub def render(): String \ IO = new StringBuilder().append("Flix").toString()
```
