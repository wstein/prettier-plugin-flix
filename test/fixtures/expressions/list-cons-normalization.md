---
title: "Normalize list cons in expressions and patterns"
description: "List cons uses spaces in expressions and patterns, while package qualifiers and glued comments keep their spelling."
group: "Operators"
options: { printWidth: 80 }
---

## Input

```flix
use pkg::Mod

def xs(): List[Int32] = 1::2::Nil

def head(): Int32 = match 1::Nil {
    case x::xs => x
    case Nil => 0
}

def guarded(xs: List[Int32]): Int32 = match xs {
    case x::y::_ => x
    case _ => 0
}

def long(): List[Int32] = 1000000::2000000::3000000::4000000::Nil

def text(): String = "${1::2::Nil}"

def note(): List[Int32] = 1::// keep
    2::Nil
```

## Output

```flix
use pkg::Mod

def xs(): List[Int32] = 1 :: 2 :: Nil

def head(): Int32 = match 1 :: Nil {
    case x :: xs => x
    case Nil     => 0
}

def guarded(xs: List[Int32]): Int32 = match xs {
    case x :: y :: _ => x
    case _           => 0
}

def long(): List[Int32] = 1000000 :: 2000000 :: 3000000 :: 4000000 :: Nil

def text(): String = "${1 :: 2 :: Nil}"

def note(): List[Int32] = 1::// keep
    2
    :: Nil
```

```flix printWidth=40
use pkg::Mod

def xs(): List[Int32] = 1 :: 2 :: Nil

def head(): Int32 = match 1 :: Nil {
    case x :: xs => x
    case Nil     => 0
}

def guarded(
    xs: List[Int32]
): Int32 = match xs {
    case x :: y :: _ => x
    case _           => 0
}

def long(): List[Int32] =
    1000000
        :: 2000000
        :: 3000000
        :: 4000000
        :: Nil

def text(): String = "${1 :: 2 :: Nil}"

def note(): List[Int32] = 1::// keep
    2
    :: Nil
```
