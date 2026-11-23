---
title: "Do not wrap a short match body only to align arrows"
description: "When padding to the arrow column would push a compact arm body onto the next line, skip alignment. Width 37 stays unaligned; 38 must not wrap `1`; 60 may align."
group: "Alignment"
options: { printWidth: 38 }
---

## Input

```flix
mod A {
    mod B {
        def f(x: Int32): Int32 = match x {
            case 100 => 1
            case 123456789012345678 => someFunction(1111111111, 2222222222, 3333333333)
        }
    }
}
```

## Output

```flix
mod A {
    mod B {
        def f(
            x: Int32
        ): Int32 = match x {
            case 100 => 1
            case 123456789012345678 =>
                someFunction(
                    1111111111,
                    2222222222,
                    3333333333
                )
        }
    }
}
```

```flix printWidth=37
mod A {
    mod B {
        def f(
            x: Int32
        ): Int32 = match x {
            case 100 => 1
            case 123456789012345678 =>
                someFunction(
                    1111111111,
                    2222222222,
                    3333333333
                )
        }
    }
}
```

```flix printWidth=60
mod A {
    mod B {
        def f(x: Int32): Int32 = match x {
            case 100                => 1
            case 123456789012345678 =>
                someFunction(
                    1111111111,
                    2222222222,
                    3333333333
                )
        }
    }
}
```
