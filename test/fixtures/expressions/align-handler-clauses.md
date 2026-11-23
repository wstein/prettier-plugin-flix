---
title: Align the equals signs of neighboring handler clauses
description: "Single-line operation signatures share a column even when their lengths differ substantially."
options: { printWidth: 100 }
---

## Input

```flix
mod CanvasExample {
    pub def runWithNoOp(dims: (Int32, Int32), f: Unit -> a \ ef): a \ ef - Canvas =
        run {
            f()
        } with handler Canvas {
            def clear(_c, k) = k()
            def fill(_c, k) = k()
            def fillAlpha(_c, _a, k) = k()
            def rect(_x, _y, _w, _h, k) = k()
            def ellipse(_x, _y, _w, _h, k) = k()
            def text(_s, _x, _y, k) = k()
            def textSize(_px, k) = k()
            def dimensions(k) = k(dims)
        }
}

def handle(f: Unit -> Int32 \ Canvas): Int32 =
    run { f() } with handler Canvas {
        def short(k) = k()
        def longer(_x, k) =
            let value = 1;
            k(value)

        def a(k) = k()
        def entry(k) = k()
        // Separate this group from the preceding clauses.
        def byName(k) = k()
        def wideName(k) = k()
    }

def byCase(xs: List[Int32]): Int32 = match xs {
    case Nil => 0
    case x :: Nil => x

    case 0 :: _ => 0
    case _ => 1
    // A separate group.
    case 1 :: _ => 1
    case y :: z :: _ => y + z
}

def byKey(): Map[String, Int32] = Map#{
    "a" => 1,
    "wide" => 2,

    // The second pair has its own column.
    "c" => 3,
    "zz" => 4
}

def fields() = {
    a = 1,
    wide = 2,

    // The second pair has its own column.
    c = 3,
    zz = 4
}
```

## Output

```flix
mod CanvasExample {
    pub def runWithNoOp(dims: (Int32, Int32), f: Unit -> a \ ef): a \ ef - Canvas =
        run {
            f()
        } with handler Canvas {
            def clear(_c, k)               = k()
            def fill(_c, k)                = k()
            def fillAlpha(_c, _a, k)       = k()
            def rect(_x, _y, _w, _h, k)    = k()
            def ellipse(_x, _y, _w, _h, k) = k()
            def text(_s, _x, _y, k)        = k()
            def textSize(_px, k)           = k()
            def dimensions(k)              = k(dims)
        }
}

def handle(f: Unit -> Int32 \ Canvas): Int32 =
    run { f() } with handler Canvas {
        def short(k)      = k()
        def longer(_x, k) =
            let value = 1;
            k(value)

        def a(k)     = k()
        def entry(k) = k()
        // Separate this group from the preceding clauses.
        def byName(k)   = k()
        def wideName(k) = k()
    }

def byCase(xs: List[Int32]): Int32 = match xs {
    case Nil      => 0
    case x :: Nil => x

    case 0 :: _ => 0
    case _      => 1
    // A separate group.
    case 1 :: _      => 1
    case y :: z :: _ => y + z
}

def byKey(): Map[String, Int32] = Map#{
    "a"    => 1,
    "wide" => 2,

    // The second pair has its own column.
    "c"  => 3,
    "zz" => 4
}

def fields() = {
    a    = 1,
    wide = 2,

    // The second pair has its own column.
    c  = 3,
    zz = 4
}
```

```flix printWidth=46
mod CanvasExample {
    pub def runWithNoOp(
        dims: (Int32, Int32),
        f: Unit -> a \ ef
    ): a \ ef - Canvas =
        run {
            f()
        } with handler Canvas {
            def clear(_c, k) = k()
            def fill(_c, k) = k()
            def fillAlpha(_c, _a, k) = k()
            def rect(_x, _y, _w, _h, k) = k()
            def ellipse(_x, _y, _w, _h, k) =
                k()
            def text(_s, _x, _y, k) = k()
            def textSize(_px, k) = k()
            def dimensions(k) = k(dims)
        }
}

def handle(f: Unit -> Int32 \ Canvas): Int32 =
    run { f() } with handler Canvas {
        def short(k)      = k()
        def longer(_x, k) =
            let value = 1;
            k(value)

        def a(k)     = k()
        def entry(k) = k()
        // Separate this group from the preceding clauses.
        def byName(k)   = k()
        def wideName(k) = k()
    }

def byCase(
    xs: List[Int32]
): Int32 = match xs {
    case Nil      => 0
    case x :: Nil => x

    case 0 :: _ => 0
    case _      => 1
    // A separate group.
    case 1 :: _      => 1
    case y :: z :: _ => y + z
}

def byKey(): Map[String, Int32] = Map#{
    "a"    => 1,
    "wide" => 2,

    // The second pair has its own column.
    "c"  => 3,
    "zz" => 4
}

def fields() = {
    a    = 1,
    wide = 2,

    // The second pair has its own column.
    c  = 3,
    zz = 4
}
```
