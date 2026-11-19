mod Checkout{
pub def total(subtotal:Int32):Int32={
let shipping=if(subtotal>=5000) 0 else 599;
subtotal+shipping
}

pub def receipt(customer:String,subtotal:Int32):String={
let cents=total(subtotal);
"${customer}: ${cents} cents including shipping"
}
}

@Test
def testFreeShipping():Unit \ Assert={
Assert.assertEq(expected=5000,Checkout.total(5000))
}

@Test
def testPaidShipping():Unit \ Assert={
Assert.assertEq(expected=1599,Checkout.total(1000))
}
