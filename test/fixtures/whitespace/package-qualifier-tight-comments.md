---
title: "Preserve tight double colons beside comments"
description: "Keep tight use-path and glued-comment cons :: ; a long tight cons chain wraps and spaces when it no longer fits."
---

## Input

```flix
use Foo /* before */::Bar.before
use Foo::/* after */ Bar.after
use Foo::Bar.spaced // ordinary use
use Foo::// keep glued
// keep this line too
Bar.next

def imported():Int32=before()+after()+spaced()+next()

def cons():List[Int32] = 1/* head */::/* tail */2 :: Nil

def spacedCons():List[Int32] = 3/* head */:: // keep after spaced cons
    /* tail */4 :: Nil

def headOrZero(xs:List[Int32]):Int32=match xs {
    case x/* head */::/* tail */_ => x
    case Nil => 0
}

def headOr(l: List[Int32]): Int32 = match l {
    case head::// rest
        _ => head
    case Nil => 0
}

def longTight(): List[Int32] = 1000000::2000000::3000000::4000000::5000000::6000000::7000000::8000000::Nil
```

## Output

```flix
use Foo/* before */::Bar.before
use Foo::/* after */Bar.after
use Foo::Bar.spaced  // ordinary use
use Foo::// keep glued
    // keep this line too
    Bar.next

def imported(): Int32 = before() + after() + spaced() + next()

def cons(): List[Int32] = 1/* head */::/* tail */2 :: Nil

def spacedCons(): List[Int32] = 3
    /* head */ ::  // keep after spaced cons
    /* tail */ 4
    :: Nil

def headOrZero(xs: List[Int32]): Int32 = match xs {
    case x/* head */::/* tail */_ => x
    case Nil                      => 0
}

def headOr(l: List[Int32]): Int32 = match l {
    case head::// rest
        _ => head
    case Nil => 0
}

def longTight(): List[Int32] =
    1000000::2000000::3000000::4000000::5000000::6000000::7000000::8000000::Nil
```

```flix printWidth=35
use Foo/* before */::Bar.before
use Foo::/* after */Bar.after
use Foo::Bar.spaced  // ordinary use
use Foo::// keep glued
    // keep this line too
    Bar.next

def imported(): Int32 =
    before() +
        after() +
        spaced() +
        next()

def cons(): List[Int32] =
    1/* head */::/* tail */2 :: Nil

def spacedCons(): List[Int32] = 3
    /* head */ ::  // keep after spaced cons
    /* tail */ 4
    :: Nil

def headOrZero(
    xs: List[Int32]
): Int32 = match xs {
    case x/* head */::/* tail */_ =>
        x
    case Nil => 0
}

def headOr(
    l: List[Int32]
): Int32 = match l {
    case head::// rest
        _ => head
    case Nil => 0
}

def longTight(): List[Int32] =
    1000000
        :: 2000000
        :: 3000000
        :: 4000000
        :: 5000000
        :: 6000000
        :: 7000000
        :: 8000000
        :: Nil
```
