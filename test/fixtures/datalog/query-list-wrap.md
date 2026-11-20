---
title: "Wrap Datalog query lists between items"
description: "Wrap query sources and from predicates before breaking their individual arguments."
flix: "0.80"
options: { printWidth: 60 }
---

## Input

```flix
def example(): Vector[String] =
    let scheduledTrainSegments = #{ Segment("Library", "Station", 10). };
    let additionalWeekendSegments = #{ Segment("Library", "Museum", 12). };
    let currentlyOpenStationRecords = #{ Available("Station"). };
    query scheduledTrainSegments, additionalWeekendSegments, currentlyOpenStationRecords
        select destinationStation
        from Segment("Library", destinationStation, travelMinutes), Available(destinationStation)
        where travelMinutes <= 30

def compact(): Vector[Int32] =
    let a = #{ A(1). };
    let b = #{ B(1). };
    query a, b select x from A(x), B(x)

def commented(): Vector[Int32] =
    let a = #{ A(1). };
    let b = #{ B(1). };
    query a, // include the first source
        b
        select x
        from A(x), // start with A
            B(x)
```

## Output

```flix
def example(): Vector[String] =
    let scheduledTrainSegments = #{
        Segment("Library", "Station", 10).
    };
    let additionalWeekendSegments = #{
        Segment("Library", "Museum", 12).
    };
    let currentlyOpenStationRecords = #{
        Available("Station").
    };
    query
        scheduledTrainSegments,
        additionalWeekendSegments,
        currentlyOpenStationRecords
        select destinationStation
        from
            Segment(
                "Library",
                destinationStation,
                travelMinutes
            ),
            Available(destinationStation)
        where travelMinutes <= 30

def compact(): Vector[Int32] =
    let a = #{ A(1). };
    let b = #{ B(1). };
    query a, b select x from A(x), B(x)

def commented(): Vector[Int32] =
    let a = #{ A(1). };
    let b = #{ B(1). };
    query
        a,  // include the first source
        b
        select x
        from
            A(x),  // start with A
            B(x)
```

```flix printWidth=100
def example(): Vector[String] =
    let scheduledTrainSegments = #{ Segment("Library", "Station", 10). };
    let additionalWeekendSegments = #{ Segment("Library", "Museum", 12). };
    let currentlyOpenStationRecords = #{ Available("Station"). };
    query scheduledTrainSegments, additionalWeekendSegments, currentlyOpenStationRecords
        select destinationStation
        from Segment("Library", destinationStation, travelMinutes), Available(destinationStation)
        where travelMinutes <= 30

def compact(): Vector[Int32] =
    let a = #{ A(1). };
    let b = #{ B(1). };
    query a, b select x from A(x), B(x)

def commented(): Vector[Int32] =
    let a = #{ A(1). };
    let b = #{ B(1). };
    query
        a,  // include the first source
        b
        select x
        from
            A(x),  // start with A
            B(x)
```
