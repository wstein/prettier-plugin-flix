---
title: "Count the hugged body after a schema-row effect set like a braced set"
description: "A `#{ ... }` effect set is braced like `{ ... }`, so a break before it reserves room for `=` and a hugged region body (#92)."
group: "Calls and function signatures"
flix: "0.80"
options: { printWidth: 50 }
---

## Input

```flix
mod M {
    pub def shuffle(rc1: Region[r1], d: MutDeque[a, r2]): MutDeque[a, r1] \ #{ R(Int32), S(Int32), T(Int32) } = region rc3 {
        result
    }
}
```

## Output

```flix
mod M {
    pub def shuffle(
        rc1: Region[r1],
        d: MutDeque[a, r2]
    ): MutDeque[a, r1] \ #{
        R(Int32),
        S(Int32),
        T(Int32)
    } = region rc3 {
        result
    }
}
```

```flix printWidth=65
mod M {
    pub def shuffle(
        rc1: Region[r1],
        d: MutDeque[a, r2]
    ): MutDeque[a, r1] \ #{
        R(Int32),
        S(Int32),
        T(Int32)
    } = region rc3 {
        result
    }
}
```
