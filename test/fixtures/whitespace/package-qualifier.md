---
title: Package qualification stays tight when an import list wraps
flix: "0.80"
---
## Input

```flix
use VeryLongPackageName::VeryLongModuleName.{foo,bar}
```

## Output

```flix
use VeryLongPackageName::VeryLongModuleName.{foo, bar}
```

```flix printWidth=20
use VeryLongPackageName::VeryLongModuleName.{
    foo,
    bar
}
```
