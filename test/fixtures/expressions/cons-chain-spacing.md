---
title: "Normalize list cons spacing and keep leading operators when wrapping"
description: "List cons in expressions and patterns is spaced. List append stays spaced and use paths stay tight."
group: "Operators"
options: { printWidth: 100 }
---

## Input

```flix
use Foo::Bar

def tightFits(): List[Int32] = 1::2::Nil

def tightTooLong(): List[Int32] = 1000000::2000000::3000000::4000000::5000000::6000000::7000000::8000000::Nil

def mixed(): List[Int32] = 1::2 :: Nil

def spaced(): List[Int32] = 1 :: 2 :: Nil

def breakBeside(): List[Int32] = 1::
2::Nil

def gluedComment(): List[Int32] = 1/* head */::/* tail */2::Nil

def appendBesideCons(): List[Int32] = (1::2::Nil) ::: (3::4::Nil)

def fs(): List[Int32 -> Int32] = (x -> {
    let y = x + 1;
    y * 2
})::(firstIncrementFunction)::(secondIncrementFunction)::(thirdIncrementFunction)::Nil

def headOf(xs: List[Int32]): Int32 = match xs {
    case x::y::_ => x
    case Nil => 0
}

def mixedHead(xs: List[Int32]): Int32 = match xs {
    case x::y :: _ => x + y
    case _ => 0
}

def imported(): Int32 = 1
```

## Output

```flix
use Foo::Bar

def tightFits(): List[Int32] = 1 :: 2 :: Nil

def tightTooLong(): List[Int32] =
    1000000 :: 2000000 :: 3000000 :: 4000000 :: 5000000 :: 6000000 :: 7000000 :: 8000000 :: Nil

def mixed(): List[Int32] = 1 :: 2 :: Nil

def spaced(): List[Int32] = 1 :: 2 :: Nil

def breakBeside(): List[Int32] = 1 :: 2 :: Nil

def gluedComment(): List[Int32] = 1/* head */::/* tail */2 :: Nil

def appendBesideCons(): List[Int32] = (1 :: 2 :: Nil) ::: (3 :: 4 :: Nil)

def fs(): List[Int32 -> Int32] = (x -> {
    let y = x + 1;
    y * 2
})
    :: (firstIncrementFunction)
    :: (secondIncrementFunction)
    :: (thirdIncrementFunction)
    :: Nil

def headOf(xs: List[Int32]): Int32 = match xs {
    case x :: y :: _ => x
    case Nil         => 0
}

def mixedHead(xs: List[Int32]): Int32 = match xs {
    case x :: y :: _ => x + y
    case _           => 0
}

def imported(): Int32 = 1
```

```flix printWidth=40
use Foo::Bar

def tightFits(): List[Int32] =
    1 :: 2 :: Nil

def tightTooLong(): List[Int32] =
    1000000
        :: 2000000
        :: 3000000
        :: 4000000
        :: 5000000
        :: 6000000
        :: 7000000
        :: 8000000
        :: Nil

def mixed(): List[Int32] = 1 :: 2 :: Nil

def spaced(): List[Int32] =
    1 :: 2 :: Nil

def breakBeside(): List[Int32] =
    1 :: 2 :: Nil

def gluedComment(): List[Int32] =
    1/* head */::/* tail */2 :: Nil

def appendBesideCons(): List[Int32] =
    (1 :: 2 :: Nil) ::: (3 :: 4 :: Nil)

def fs(): List[Int32 -> Int32] = (x -> {
    let y = x + 1;
    y * 2
})
    :: (firstIncrementFunction)
    :: (secondIncrementFunction)
    :: (thirdIncrementFunction)
    :: Nil

def headOf(
    xs: List[Int32]
): Int32 = match xs {
    case x :: y :: _ => x
    case Nil         => 0
}

def mixedHead(
    xs: List[Int32]
): Int32 = match xs {
    case x :: y :: _ => x + y
    case _           => 0
}

def imported(): Int32 = 1
```
