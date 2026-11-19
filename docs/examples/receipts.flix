enum Donation{
case Cents(Int32)
}

trait ReceiptFormat[a]{
type Line[a]:Type
pub def receiptLine(value:a):ReceiptFormat.Line[a]
}

instance ReceiptFormat[Donation]{
type Line[Donation]=String
pub def receiptLine(value:Donation):String=match value{
case Donation.Cents(cents)=>"Donation: ${cents} cents"
}
}

pub def donationReceipt():String={
let donation=Donation.Cents(2500);
ReceiptFormat.receiptLine(donation)
}
