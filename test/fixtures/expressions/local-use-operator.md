---
title: "Local use of a custom operator"
group: "Additional language constructs"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Use.Def.flix#L81"
---

## Input

```flix
@CompileTest
def testMod16(): Bool =
    use Op.{<><};
    "one" <>< "two" == "one fish two"
```

## Output

```flix
@CompileTest
def testMod16(): Bool =
    use Op.{<><};
    "one" <>< "two" == "one fish two"
```
