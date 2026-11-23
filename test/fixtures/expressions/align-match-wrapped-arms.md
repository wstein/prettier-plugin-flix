---
title: "Do not align arrows when every match arm body wraps"
description: "With both arms wrapping, alignment padding must still fail the print-width check that includes arm indent (#154). Width 34 prints `case 100 =>` without padding."
group: "Alignment"
options: { printWidth: 34 }
---

## Input

```flix
mod A {
    mod B {
        def f(x: Int32): Int32 = match x {
            case 100 => someFunction(1111111111, 2222222222, 3333333333)
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
            case 100 =>
                someFunction(
                    1111111111,
                    2222222222,
                    3333333333
                )
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
