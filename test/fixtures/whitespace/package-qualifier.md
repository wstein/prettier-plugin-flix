---
title: Package qualification stays tight when an import list wraps
flix: "0.80"
flixFormat: "0.80.0"
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

## Flix Format

The isolated input has no mounted package.

```text
Resolution Error [E3142]: Undefined package 'VeryLongPackageName'.
```
