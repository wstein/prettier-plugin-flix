---
title: "Apply a match lambda"
group: "Additional language constructs"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Exp.Lambda.Match.flix#L33"
---

## Input

```flix
@CompileTest
def testLambdaMatch09(): Int32 = (match x -> x)(1)
```

## Output

```flix
@CompileTest
def testLambdaMatch09(): Int32 = (match x -> x)(1)
```
