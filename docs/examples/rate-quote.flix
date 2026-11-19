eff ExchangeRate{
def rate():Int32
}

def toCents(units:Int32):Int32 \ ExchangeRate={
let centsPerUnit=ExchangeRate.rate();
units*centsPerUnit
}

pub def fixedQuote(units:Int32):Int32=
run {toCents(units)} with handler ExchangeRate{
def rate(k)=k(125)
}

@Test
def testFixedQuote():Unit \ Assert={
Assert.assertEq(expected=375,fixedQuote(3))
}
