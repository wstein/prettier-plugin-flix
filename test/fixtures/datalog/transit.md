---
title: "Transit routes"
description: "Show facts, recursive reachability, and a query over short train trips."
group: "Playground examples"
flix: "0.80"
---

## Input

```flix
def timetable():Vector[(String,Int32,String)]=Vector#{
("Museum",8,"Central"),
("Central",7,"Library"),
("Central",45,"Airport"), // This leg exceeds the short-trip limit.
("Library",6,"Park"),
("Park",9,"Museum")
}

pub def reachableStops(origin:String,maxLegMinutes:Int32):Vector[String]={
let facts=inject timetable() into Segment/3;
let rules=#{
// The starting stop is reachable before taking a train.
CanRide(origin).
// Each transfer extends a route by one short leg.
CanRide(dst):-CanRide(src),Segment(src,minutes,dst),if(minutes<=maxLegMinutes).
};
query facts,rules select stop from CanRide(stop) where stop != origin
}

pub def shortTrips():Vector[String]=
reachableStops("Museum",15)

@Test
def testShortTripsSkipAirport():Unit \ Assert={
let includesAirport=Vector.exists(stop -> stop == "Airport",shortTrips());
Assert.assertEq(expected=false,includesAirport)
}
```

## Output

```flix
def timetable(): Vector[(String, Int32, String)] = Vector#{
    ("Museum", 8, "Central"),
    ("Central", 7, "Library"),
    ("Central", 45, "Airport"), // This leg exceeds the short-trip limit.
    ("Library", 6, "Park"),
    ("Park", 9, "Museum")
}

pub def reachableStops(origin: String, maxLegMinutes: Int32): Vector[String] = {
    let facts = inject timetable() into Segment/3;
    let rules = #{
        // The starting stop is reachable before taking a train.
        CanRide(origin).
        // Each transfer extends a route by one short leg.
        CanRide(dst) :- CanRide(src), Segment(src, minutes, dst), if (
            minutes <= maxLegMinutes
        ).
    };
    query facts, rules select stop from CanRide(stop) where stop != origin
}

pub def shortTrips(): Vector[String] = reachableStops("Museum", 15)

@Test
def testShortTripsSkipAirport(): Unit \ Assert = {
    let includesAirport =
        Vector.exists(stop -> stop == "Airport", shortTrips());
    Assert.assertEq(expected = false, includesAirport)
}
```
