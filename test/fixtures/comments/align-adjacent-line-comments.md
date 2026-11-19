---
title: Align neighboring line-end comments
description: "Share a comment column across adjacent code rows when the extra padding and the full comments fit. Blank lines, uncommented code and nested blocks end a group."
flix: "0.80"
group: "Line endings and comment placement"
source: "https://github.com/flix/book/blob/64d81bd6984ede06442ef7b63235092b9fe3c29c/src/traits.md#L177"
---

## Input

```flix
trait Animal[a] {
    pub def isMammal(x: a): Bool // OK, mentions a.
    pub def numberOfGiraffes(): Int32 // NOT OK.
}

def sample(): Int32 = {
    let a = 1; // First
    let longer = 2; // Second

    let b = 3; // Separate group
    let other = 4; // Same group
    let n = {
        let t = 5; // Next block
        let temp = 6; // Same block
        t + temp
    };
    let result = a + longer + b + other + n; // A single comment
    result
}
```

## Output

```flix
trait Animal[a] {
    pub def isMammal(x: a): Bool       // OK, mentions a.
    pub def numberOfGiraffes(): Int32  // NOT OK.
}

def sample(): Int32 = {
    let a = 1;       // First
    let longer = 2;  // Second

    let b = 3;      // Separate group
    let other = 4;  // Same group
    let n = {
        let t = 5;     // Next block
        let temp = 6;  // Same block
        t + temp
    };
    let result = a + longer + b + other + n;  // A single comment
    result
}
```

```flix printWidth=48
trait Animal[a] {
    pub def isMammal(x: a): Bool  // OK, mentions a.
    pub def numberOfGiraffes(): Int32  // NOT OK.
}

def sample(): Int32 = {
    let a = 1;       // First
    let longer = 2;  // Second

    let b = 3;      // Separate group
    let other = 4;  // Same group
    let n = {
        let t = 5;     // Next block
        let temp = 6;  // Same block
        t + temp
    };
    let result = a + longer + b + other + n;  // A single comment
    result
}
```
