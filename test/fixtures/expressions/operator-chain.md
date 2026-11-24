---
title: Operator chains wrap before the operator
description: "A long addition chain wraps before each operator so the continuation is leading."
---

## Input

```flix
def total(): Int32 = alphaAlphaAlpha + betaBetaBeta + gammaGammaGamma + deltaDeltaDelta + epsilonEpsilon
```

## Output

```flix
def total(): Int32 =
    alphaAlphaAlpha
        + betaBetaBeta
        + gammaGammaGamma
        + deltaDeltaDelta
        + epsilonEpsilon
```
