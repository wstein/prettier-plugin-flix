---
title: "Wrap solve and inject at clause and list boundaries"
description: "Break before project or into, then wrap their lists and the source lists where needed."
flix: "0.80"
options: { printWidth: 60 }
---

## Input

```flix
def projected(): Unit =
    let scheduledTrainSegments = #{ ScheduledSegment("Station"). };
    let additionalWeekendSegments = #{ WeekendSegment("Museum"). };
    let currentlyOpenStationRecords = #{ OpenStation("Station"). };
    let _ = solve scheduledTrainSegments, additionalWeekendSegments, currentlyOpenStationRecords
        project ScheduledSegment, WeekendSegment, OpenStation;
    ()

def injected(): Unit =
    let scheduledTrainSegments = Vector#{"Station"};
    let additionalWeekendSegments = Vector#{"Museum"};
    let _ = inject scheduledTrainSegments, additionalWeekendSegments
        into ScheduledSegmentForWeekdays/1, AdditionalWeekendSegment/1;
    ()

def compact(): Unit =
    let p = inject Vector#{1} into A/1;
    let _ = solve p project A;
    let _ = psolve p, // retain both sources
        p;
    ()

def commented(): #{ A(Int32) } =
    let p = inject Vector#{1}, Vector#{2} // after the last source
        into A/1, B/1;
    let q = inject Vector#{3}
        // before into
        into A/1;
    let aVeryLongSingleSourceIdentifierNameThatDoesNotFitAtAll = q;
    let _ = solve aVeryLongSingleSourceIdentifierNameThatDoesNotFitAtAll project A;
    let _ = solve p project // after project
        A;
    solve p project A

def solveBoundary(): Unit =
    let sourceAlphaAAA = #{ A(1). };
    let sourceBetaBBBB = #{ B(1). };
    let sourceGammaCCC = #{ C(1). };
    let _ = solve sourceAlphaAAA, sourceBetaBBBB, sourceGammaCCC project A, B, C;
    ()

def injectBoundary(): Unit =
    let injectSourceAlphaAAAAA = Vector#{1};
    let injectSourceBetaBBBBB = Vector#{2};
    let _ = inject injectSourceAlphaAAAAA, injectSourceBetaBBBBB into PredA/1, PredB/1;
    ()
```

## Output

```flix
def projected(): Unit =
    let scheduledTrainSegments = #{
        ScheduledSegment("Station").
    };
    let additionalWeekendSegments = #{
        WeekendSegment("Museum").
    };
    let currentlyOpenStationRecords = #{
        OpenStation("Station").
    };
    let _ =
        solve
            scheduledTrainSegments,
            additionalWeekendSegments,
            currentlyOpenStationRecords
            project
                ScheduledSegment,
                WeekendSegment,
                OpenStation;
    ()

def injected(): Unit =
    let scheduledTrainSegments = Vector#{"Station"};
    let additionalWeekendSegments = Vector#{"Museum"};
    let _ =
        inject
            scheduledTrainSegments,
            additionalWeekendSegments
            into
                ScheduledSegmentForWeekdays/1,
                AdditionalWeekendSegment/1;
    ()

def compact(): Unit =
    let p = inject Vector#{1} into A/1;
    let _ = solve p project A;
    let _ = psolve
        p,  // retain both sources
        p;
    ()

def commented(): #{ A(Int32) } =
    let p = inject Vector#{1}, Vector#{2}  // after the last source
        into A/1, B/1;
    let q = inject Vector#{3}
        // before into
        into A/1;
    let aVeryLongSingleSourceIdentifierNameThatDoesNotFitAtAll =
        q;
    let _ =
        solve aVeryLongSingleSourceIdentifierNameThatDoesNotFitAtAll
            project A;
    let _ = solve p
        project  // after project
            A;
    solve p project A

def solveBoundary(): Unit =
    let sourceAlphaAAA = #{ A(1). };
    let sourceBetaBBBB = #{ B(1). };
    let sourceGammaCCC = #{ C(1). };
    let _ =
        solve sourceAlphaAAA, sourceBetaBBBB, sourceGammaCCC
            project A, B, C;
    ()

def injectBoundary(): Unit =
    let injectSourceAlphaAAAAA = Vector#{1};
    let injectSourceBetaBBBBB = Vector#{2};
    let _ =
        inject injectSourceAlphaAAAAA, injectSourceBetaBBBBB
            into PredA/1, PredB/1;
    ()
```

```flix printWidth=100
def projected(): Unit =
    let scheduledTrainSegments = #{ ScheduledSegment("Station"). };
    let additionalWeekendSegments = #{ WeekendSegment("Museum"). };
    let currentlyOpenStationRecords = #{ OpenStation("Station"). };
    let _ =
        solve scheduledTrainSegments, additionalWeekendSegments, currentlyOpenStationRecords
            project ScheduledSegment, WeekendSegment, OpenStation;
    ()

def injected(): Unit =
    let scheduledTrainSegments = Vector#{"Station"};
    let additionalWeekendSegments = Vector#{"Museum"};
    let _ =
        inject scheduledTrainSegments, additionalWeekendSegments
            into ScheduledSegmentForWeekdays/1, AdditionalWeekendSegment/1;
    ()

def compact(): Unit =
    let p = inject Vector#{1} into A/1;
    let _ = solve p project A;
    let _ = psolve
        p,  // retain both sources
        p;
    ()

def commented(): #{ A(Int32) } =
    let p = inject Vector#{1}, Vector#{2}  // after the last source
        into A/1, B/1;
    let q = inject Vector#{3}
        // before into
        into A/1;
    let aVeryLongSingleSourceIdentifierNameThatDoesNotFitAtAll = q;
    let _ = solve aVeryLongSingleSourceIdentifierNameThatDoesNotFitAtAll project A;
    let _ = solve p
        project  // after project
            A;
    solve p project A

def solveBoundary(): Unit =
    let sourceAlphaAAA = #{ A(1). };
    let sourceBetaBBBB = #{ B(1). };
    let sourceGammaCCC = #{ C(1). };
    let _ = solve sourceAlphaAAA, sourceBetaBBBB, sourceGammaCCC project A, B, C;
    ()

def injectBoundary(): Unit =
    let injectSourceAlphaAAAAA = Vector#{1};
    let injectSourceBetaBBBBB = Vector#{2};
    let _ = inject injectSourceAlphaAAAAA, injectSourceBetaBBBBB into PredA/1, PredB/1;
    ()
```

```flix printWidth=59
def projected(): Unit =
    let scheduledTrainSegments = #{
        ScheduledSegment("Station").
    };
    let additionalWeekendSegments = #{
        WeekendSegment("Museum").
    };
    let currentlyOpenStationRecords = #{
        OpenStation("Station").
    };
    let _ =
        solve
            scheduledTrainSegments,
            additionalWeekendSegments,
            currentlyOpenStationRecords
            project
                ScheduledSegment,
                WeekendSegment,
                OpenStation;
    ()

def injected(): Unit =
    let scheduledTrainSegments = Vector#{"Station"};
    let additionalWeekendSegments = Vector#{"Museum"};
    let _ =
        inject
            scheduledTrainSegments,
            additionalWeekendSegments
            into
                ScheduledSegmentForWeekdays/1,
                AdditionalWeekendSegment/1;
    ()

def compact(): Unit =
    let p = inject Vector#{1} into A/1;
    let _ = solve p project A;
    let _ = psolve
        p,  // retain both sources
        p;
    ()

def commented(): #{ A(Int32) } =
    let p = inject Vector#{1}, Vector#{2}  // after the last source
        into A/1, B/1;
    let q = inject Vector#{3}
        // before into
        into A/1;
    let aVeryLongSingleSourceIdentifierNameThatDoesNotFitAtAll =
        q;
    let _ =
        solve aVeryLongSingleSourceIdentifierNameThatDoesNotFitAtAll
            project A;
    let _ = solve p
        project  // after project
            A;
    solve p project A

def solveBoundary(): Unit =
    let sourceAlphaAAA = #{ A(1). };
    let sourceBetaBBBB = #{ B(1). };
    let sourceGammaCCC = #{ C(1). };
    let _ =
        solve
            sourceAlphaAAA,
            sourceBetaBBBB,
            sourceGammaCCC
            project A, B, C;
    ()

def injectBoundary(): Unit =
    let injectSourceAlphaAAAAA = Vector#{1};
    let injectSourceBetaBBBBB = Vector#{2};
    let _ =
        inject
            injectSourceAlphaAAAAA,
            injectSourceBetaBBBBB
            into PredA/1, PredB/1;
    ()
```
