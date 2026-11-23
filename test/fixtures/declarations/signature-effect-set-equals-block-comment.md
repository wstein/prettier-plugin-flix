---
title: "Keep signature breaks stable when a block comment sits before `=`"
description: "A block comment between a braced effect set and `=` must count in the trailer width so the first pass matches the second (#92 comment-site)."
group: "Calls and function signatures"
options: { printWidth: 60 }
---

## Input

```flix
mod M {
    pub def shuffle(rc1: Region[r1], d: MutDeque[a, r2]): MutDeque[a, r1] \ { r2, r1, Shuffle } /* note */ = region rc3 {
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
    } /* note */ = region rc3 {
        result
    }
}
```

```flix printWidth=40
mod M {
    pub def shuffle(
        rc1: Region[r1],
        d: MutDeque[a, r2]
    ): MutDeque[a, r1] \ {
        r2,
        r1,
        Shuffle
    } /* note */ = region rc3 {
        result
    }
}
```
