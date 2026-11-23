---
title: Package qualification stays tight when an import list wraps
description: "The import list can wrap at a narrow width while the package qualifier stays together. The isolated Flix reference lacks a mounted package."
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
