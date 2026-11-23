---
title: "Extensible match lambda"
group: "Additional language constructs"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Exp.Lambda.ExtMatch.flix#L17"
---

## Input

```flix
@CompileTest
def testLambdaExtMatch05(): #| A(Int32) |# -> Int32 = ematch _ -> 42
```

## Output

```flix
@CompileTest
def testLambdaExtMatch05(): #| A(Int32) |# -> Int32 = ematch _ -> 42
```
