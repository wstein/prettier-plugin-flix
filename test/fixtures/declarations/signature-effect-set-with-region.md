---
title: "Keep an effect set with the return type when the continuation cannot hold set and body"
description: "A break before a braced effect set must leave room for `=` and a hugged region body; otherwise the first pass joins the set to the return type."
group: "Calls and function signatures"
options: { printWidth: 40 }
---

## Input

```flix
mod M {
    pub def shuffle(rc1: Region[r1], d: MutDeque[a, r2]): MutDeque[a, r1] \ { r2, r1, Shuffle } = region rc3 {
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
    ): MutDeque[a, r1] \ {
        r2,
        r1,
        Shuffle
    } = region rc3 {
        result
    }
}
```

```flix printWidth=60
mod M {
    pub def shuffle(rc1: Region[r1], d: MutDeque[a, r2]):
        MutDeque[a, r1] \ { r2, r1, Shuffle } = region rc3 {
        result
    }
}
```

```flix printWidth=80
mod M {
    pub def shuffle(rc1: Region[r1], d: MutDeque[a, r2]): MutDeque[a, r1]
        \ { r2, r1, Shuffle } = region rc3 {
        result
    }
}
```

```flix printWidth=100
mod M {
    pub def shuffle(rc1: Region[r1], d: MutDeque[a, r2]): MutDeque[a, r1]
        \ { r2, r1, Shuffle } = region rc3 {
        result
    }
}
```
