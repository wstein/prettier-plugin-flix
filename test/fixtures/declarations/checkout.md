---
title: "Checkout and shipping"
description: "Format a checkout module, shipping rules, and receipt tests."
group: "Playground examples"
flix: "0.80"
---

## Input

```flix
mod Checkout{
pub def total(subtotal:Int32):Int32={
// Orders of at least 50 currency units ship free.
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

@Test
def testPrintedReceipt():Unit \ Assert=
Assert.assertEq(expected="Jo: 1599 cents including shipping",Checkout.receipt("Jo",1000))
```

## Output

```flix
mod Checkout {
    pub def total(subtotal: Int32): Int32 = {
        // Orders of at least 50 currency units ship free.
        let shipping = if (subtotal >= 5000) 0 else 599;
        subtotal + shipping
    }

    pub def receipt(customer: String, subtotal: Int32): String = {
        let cents = total(subtotal);
        "${customer}: ${cents} cents including shipping"
    }
}

@Test
def testFreeShipping(): Unit \ Assert = {
    Assert.assertEq(expected = 5000, Checkout.total(5000))
}

@Test
def testPaidShipping(): Unit \ Assert = {
    Assert.assertEq(expected = 1599, Checkout.total(1000))
}

@Test
def testPrintedReceipt(): Unit \ Assert =
    Assert.assertEq(
        expected = "Jo: 1599 cents including shipping",
        Checkout.receipt("Jo", 1000)
    )
```
