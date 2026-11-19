---
title: An import-list comment stays beside its item without separating the package qualifier
flix: "0.80"
---

## Input

```flix
use VeryLongPackageName::VeryLongModuleName.{foo, // keep
bar}
```

## Output

```flix
use VeryLongPackageName::VeryLongModuleName.{
    foo, // keep
    bar
}
```

```flix printWidth=20
use VeryLongPackageName::VeryLongModuleName.{
    foo, // keep
    bar
}
```
