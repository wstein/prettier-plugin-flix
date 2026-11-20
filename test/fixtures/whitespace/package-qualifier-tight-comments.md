---
title: "Preserve tight double colons beside comments"
description: "Keep the tight package qualifier and cons operator when a comment touches either side of the double colon."
flix: "0.80"
---

## Input

```flix
use Foo /* before */::Bar.before
use Foo::/* after */ Bar.after
use Foo::Bar.spaced // ordinary use
use Foo::// keep glued
Bar.next

def imported():Int32=before()+after()+spaced()+next()

def cons():List[Int32] = 1/* head */::/* tail */2 :: Nil

def spacedCons():List[Int32] = 3/* head */:: // keep after spaced cons
    /* tail */4 :: Nil

def headOrZero(xs:List[Int32]):Int32=match xs {
    case x/* head */::/* tail */_ => x
    case Nil => 0
}
```

## Output

```flix
use Foo/* before */::Bar.before
use Foo::/* after */Bar.after
use Foo::Bar.spaced  // ordinary use
use Foo::// keep glued
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
```

```flix printWidth=35
use Foo/* before */::Bar.before
use Foo::/* after */Bar.after
use Foo::Bar.spaced  // ordinary use
use Foo::// keep glued
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
```
