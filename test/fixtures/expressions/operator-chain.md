---
title: Operator chains wrap after the operator
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
