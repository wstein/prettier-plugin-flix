pub def reachableStops(origin:String,maxLegMinutes:Int32):Vector[String]={
let timetable=Vector#{("Museum","Central",8),("Central","Library",7),("Central","Airport",45),("Library","Park",6)};
let facts=inject timetable into Segment/3;
let rules=#{
CanRide(origin).
CanRide(dst):-CanRide(src),Segment(src,dst,minutes),if(minutes<=maxLegMinutes).
};
query facts,rules select stop from CanRide(stop) where stop != origin
}

pub def shortTrips():Vector[String]=
reachableStops("Museum",15)
