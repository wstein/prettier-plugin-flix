---
title: "Currency quote"
description: "Format a trait, an associated type, an effect handler, and a deterministic quote test."
group: "Playground examples"
---

## Input

```flix
eff ExchangeRate{
def rate():Int32
}

trait FormatQuote[a]{
type Line[a]:Type
pub def formatQuote(value:a):FormatQuote.Line[a]
}

instance FormatQuote[Int32]{
type Line[Int32]=String
pub def formatQuote(cents:Int32):String="${cents} cents"
}

def quote(units:Int32):String \ ExchangeRate={
let cents=units*ExchangeRate.rate();
FormatQuote.formatQuote(cents)
}

pub def fixedQuote(units:Int32):String=
run {quote(units)} with handler ExchangeRate{
// A fixed rate makes the receipt reproducible in tests.
def rate(k)=k(125)
}

@Test
def testFixedQuote():Unit \ Assert=
Assert.assertEq(expected="375 cents",fixedQuote(3))
```

## Output

```flix
eff ExchangeRate {
    def rate(): Int32
}

trait FormatQuote[a] {
    type Line[a]: Type
    pub def formatQuote(value: a): FormatQuote.Line[a]
}

instance FormatQuote[Int32] {
    type Line[Int32] = String
    pub def formatQuote(cents: Int32): String = "${cents} cents"
}

def quote(units: Int32): String \ ExchangeRate = {
    let cents = units * ExchangeRate.rate();
    FormatQuote.formatQuote(cents)
}

pub def fixedQuote(units: Int32): String =
    run { quote(units) } with handler ExchangeRate {
        // A fixed rate makes the receipt reproducible in tests.
        def rate(k) = k(125)
    }

@Test
def testFixedQuote(): Unit \ Assert =
    Assert.assertEq(expected = "375 cents", fixedQuote(3))
```
