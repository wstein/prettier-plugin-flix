---
title: A method or qualifier dot stays tight next to a comment
description: "Keep the dot adjacent to its comment so Flix reads it as part of the method call or qualified name."
flix: "0.80"
---

## Input

```flix
mod Tools {
    pub def value(): Int32 = 1
}

def method(s: String): String = {
    let result = s.trim().// keep the method dot tight
    toLowerCase(); // keep this separate comment
    result
}

def qualified(): Int32 = Tools.// keep the qualifier dot tight
value()

def blockComment(s: String): String = s.trim()./* keep */toLowerCase()

def beforeDot(s: String): String =
    s.trim()
    /* keep next to the dot */.toLowerCase()
```

## Output

```flix
mod Tools {
    pub def value(): Int32 = 1
}

def method(s: String): String = {
    let result = s.trim().// keep the method dot tight
    toLowerCase();  // keep this separate comment
    result
}

def qualified(): Int32 = Tools.// keep the qualifier dot tight
value()

def blockComment(s: String): String = s.trim()./* keep */toLowerCase()

def beforeDot(s: String): String =
    s.trim()
    /* keep next to the dot */.toLowerCase()
```

```flix printWidth=40
mod Tools {
    pub def value(): Int32 = 1
}

def method(s: String): String = {
    let result = s.trim().// keep the method dot tight
    toLowerCase();  // keep this separate comment
    result
}

def qualified(): Int32 = Tools.// keep the qualifier dot tight
value()

def blockComment(s: String): String =
    s.trim()./* keep */toLowerCase()

def beforeDot(s: String): String =
    s.trim()
    /* keep next to the dot */.toLowerCase()
```
