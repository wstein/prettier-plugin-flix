---
title: "Empty record type and value"
group: "Types and constraints"
flix: "0.80"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Exp.Record.Literal.flix#L3"
---

## Input

```flix
@CompileTest
def testEmptyRecord01(): {|} =
    {}
```

## Output

```flix
@CompileTest
def testEmptyRecord01(): { | } = {}
```
