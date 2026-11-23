---
title: Operator chains wrap after the operator
description: "A long addition chain wraps after operators without changing the operand order."
---

## Input

```flix
def total(): Int32 = alphaAlphaAlpha + betaBetaBeta + gammaGammaGamma + deltaDeltaDelta + epsilonEpsilon
```

## Output

```flix
def total(): Int32 =
    alphaAlphaAlpha +
        betaBetaBeta +
        gammaGammaGamma +
        deltaDeltaDelta +
        epsilonEpsilon
```
