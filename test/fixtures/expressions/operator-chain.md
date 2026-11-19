---
title: Operator chains wrap after the operator
description: "A long addition chain wraps after operators without changing the operand order."
flix: "0.80"
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
