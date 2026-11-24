---
title: Comment after a binary operator keeps a trailing break
description: "A line comment that trails the operator, or an own-line comment before the next operand, keeps the operator at the end of the preceding line so the comment stays attached and formatting stays idempotent. List-append `:::` matches binary ops, including inside string interpolations where hardline must stay hard."
options: { printWidth: 40 }
---

## Input

```flix
def trail(): Int32 = alphaAlphaAlpha + // note
    betaBetaBeta

def ownLine(): Int32 = alphaAlphaAlpha +
    // note
    betaBetaBeta + gammaGammaGamma

def appendTrail(): List[Int32] = xs ::: // note
    ys

def appendOwn(): List[Int32] = (1 :: 2 :: Nil) :::
    // note
    (3 :: 4 :: Nil) ::: Nil

def appendLead(): List[Int32] = xs
    // note
    ::: ys

def interpPlus(): String = "${a +
    // note
    b}"

def interpAppend(): String = "${xs :::
    // note
    ys}"
```

## Output

```flix
def trail(): Int32 = alphaAlphaAlpha +  // note
    betaBetaBeta

def ownLine(): Int32 = alphaAlphaAlpha +
    // note
    betaBetaBeta
    + gammaGammaGamma

def appendTrail(): List[Int32] = xs :::  // note
    ys

def appendOwn(): List[Int32] = (
    1 :: 2 :: Nil
) :::
    // note
    (3 :: 4 :: Nil)
    ::: Nil

def appendLead(): List[Int32] = xs
    // note
    ::: ys

def interpPlus(): String = "${a +
    // note
    b}"

def interpAppend(): String = "${xs :::
    // note
    ys}"
```
