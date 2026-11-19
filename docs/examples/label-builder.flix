import java.lang.StringBuilder

pub def shippingLabel(recipient:String,city:String,country:String):String \ IO={
let label=new StringBuilder();
let header=label.append(recipient).append("\n");
let address=header.append(city).append(", ").append(country);
address.toString()
}

pub def sampleLabel():String \ IO=
shippingLabel("Ada Lovelace","London","UK")
