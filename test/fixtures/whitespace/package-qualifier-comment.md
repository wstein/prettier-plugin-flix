---
title: An import-list comment stays beside its item without separating the package qualifier
description: "A line comment can split the import list. The package and module separator must stay tight."
---

## Input

```flix
use VeryLongPackageName::VeryLongModuleName.{foo, // keep
bar}
```

## Output

```flix
use VeryLongPackageName::VeryLongModuleName.{
    foo,  // keep
    bar
}
```

```flix printWidth=20
use VeryLongPackageName::VeryLongModuleName.{
    foo,  // keep
    bar
}
```
