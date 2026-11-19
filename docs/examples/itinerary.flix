import java.lang.StringBuilder

def stops():List[(String,Int32)]=
("🚆 Berlin",8)
:: ("🛤️ Köln",16)
:: ("🚉 Bonn",12)
:: Nil

def shortStops(maxMinutes:Int32):List[String]={
let eligible=List.filter(match (_,minutes) -> minutes<=maxMinutes,stops());
List.map(match (station,minutes) -> "${station} · ${minutes} min",eligible)
}

pub def departureBoard(maxMinutes:Int32):String \ IO={
let board=new StringBuilder();
let title="Departures within ${maxMinutes} minutes";
let lines=shortStops(maxMinutes);
// Keep the heading separate from the filtered departures.
let header=board.append(title).append("\n");
let listing=header.append(String.intercalate("\n",lines));
listing.toString()
}

pub def morningBoard():String \ IO=
departureBoard(12)
