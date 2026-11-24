---
title: Leading `*` `/` and `<+>` when chains wrap
description: "Multiplication, division, and vector append wrap before each operator, matching flix format's prettyBinary for MultExpr and AngledPlusExpr."
options: { printWidth: 40 }
---

## Input

```flix
def mul(): Int32 = alphaAlphaAlpha * betaBetaBeta * gammaGammaGamma * deltaDeltaDelta

def div(): Int32 = alphaAlphaAlpha / betaBetaBeta / gammaGammaGamma / deltaDeltaDelta

def angled(): Vector[Int32] = alphaAlphaAlpha <+> betaBetaBeta <+> gammaGammaGamma <+> deltaDeltaDelta
```

## Output

```flix
def mul(): Int32 =
    alphaAlphaAlpha
        * betaBetaBeta
        * gammaGammaGamma
        * deltaDeltaDelta

def div(): Int32 =
    alphaAlphaAlpha
        / betaBetaBeta
        / gammaGammaGamma
        / deltaDeltaDelta

def angled(): Vector[Int32] =
    alphaAlphaAlpha
        <+> betaBetaBeta
        <+> gammaGammaGamma
        <+> deltaDeltaDelta
```

```flix printWidth=80
def mul(): Int32 =
    alphaAlphaAlpha * betaBetaBeta * gammaGammaGamma * deltaDeltaDelta

def div(): Int32 =
    alphaAlphaAlpha / betaBetaBeta / gammaGammaGamma / deltaDeltaDelta

def angled(): Vector[Int32] =
    alphaAlphaAlpha <+> betaBetaBeta <+> gammaGammaGamma <+> deltaDeltaDelta
```
