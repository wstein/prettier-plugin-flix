---
title: Align nested rows only when they fit
description: The indentation of the nested module counts toward the width. At wide settings both arrow groups align.
---

## Input

```flix
mod Outer {
 mod Inner {
    def labels() = Map#{
        "a" => 123456789,
        "longer" => 2
    }
    def area(x: Int32): Int32 = match x {
        case 0 => 123456789
        case 12345 => 2
        case _ => 0
    }
 }
}
```

## Output

```flix
mod Outer {
    mod Inner {
        def labels() = Map#{
            "a"      => 123456789,
            "longer" => 2
        }
        def area(x: Int32): Int32 = match x {
            case 0     => 123456789
            case 12345 => 2
            case _     => 0
        }
    }
}
```

```flix printWidth=32
mod Outer {
    mod Inner {
        def labels() = Map#{
            "a" => 123456789,
            "longer" => 2
        }
        def area(
            x: Int32
        ): Int32 = match x {
            case 0 => 123456789
            case 12345 => 2
            case _ => 0
        }
    }
}
```
