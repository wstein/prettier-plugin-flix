pub def receiveStock(item:{sku=String,count=Int32|r},incoming:Int32):{sku=String,count=Int32|r}={
let updated={count=item#count+incoming|item};
updated
}

pub def inventoryLabel():String={
let shipment={
sku="PENCIL",
count=4,
warehouse="North"
};
let updated=receiveStock(shipment,12);
"${updated#warehouse}: ${updated#count} in stock for ${updated#sku}"
}
