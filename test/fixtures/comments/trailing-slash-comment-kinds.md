---
title: Align trailing comments with four or more slashes
description: "Four or more slashes form a regular line comment. Exactly three slashes denote Flixdoc and retain their own spacing and attachment."
group: "Line endings and comment placement"
options: { printWidth: 40, flixVersion: "0.80.0" }
---

## Input

```flix
def a(): Int32 = 1 //// Four
def longer(): Int32 = 2 ///// Five
def b(): Int32 = 3 // Two

def lone(): Int32 = 4 ///
def normalAfter(): Int32 = 7 // Two

def isolated(): Int32 = 8 //// Solo

//// Banner

def afterBanner(): Int32 = 5

/// Documentation

def documented(): Int32 = 6
```

## Output

```flix
def a(): Int32 = 1       //// Four
def longer(): Int32 = 2  ///// Five
def b(): Int32 = 3       // Two

def lone(): Int32 = 4 ///
def normalAfter(): Int32 = 7  // Two

def isolated(): Int32 = 8  //// Solo

//// Banner

def afterBanner(): Int32 = 5

/// Documentation
def documented(): Int32 = 6
```

```flix printWidth=80 flixVersion=0.79.0
def a(): Int32 = 1       //// Four
def longer(): Int32 = 2  ///// Five
def b(): Int32 = 3       // Two

def lone(): Int32 = 4 ///
def normalAfter(): Int32 = 7  // Two

def isolated(): Int32 = 8  //// Solo

//// Banner

def afterBanner(): Int32 = 5

/// Documentation
def documented(): Int32 = 6
```
