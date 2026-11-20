---
title: "Wrap long function types after their arrows"
description: "Keep short function types compact and preserve nested function types, effects, and comments."
group: "Types and constraints"
flix: "0.80"
options: { printWidth: 60 }
---

## Input

```flix
type alias DepartureStation = String
type alias IntermediateTransferStation = String
type alias EstimatedTravelDuration = Int32
type alias FinalDestination = String
type alias JourneyPlanner = DepartureStation -> IntermediateTransferStation -> EstimatedTravelDuration -> FinalDestination

type alias NestedPlanner = (DepartureStation -> IntermediateTransferStation) -> EstimatedTravelDuration -> FinalDestination

type alias EffectfulPlanner = DepartureStation -> IntermediateTransferStation -> EstimatedTravelDuration -> FinalDestination \ IO

type alias CommentedPlanner =
    DepartureStation -> // transfer station follows
    IntermediateTransferStation -> EstimatedTravelDuration -> FinalDestination

type alias Compact = String -> Int32

def makePlanner(): DepartureStation -> IntermediateTransferStation -> EstimatedTravelDuration -> FinalDestination =
    _departure -> _transfer -> _duration -> "Destination"
```

## Output

```flix
type alias DepartureStation = String
type alias IntermediateTransferStation = String
type alias EstimatedTravelDuration = Int32
type alias FinalDestination = String
type alias JourneyPlanner =
    DepartureStation ->
    IntermediateTransferStation ->
    EstimatedTravelDuration ->
        FinalDestination

type alias NestedPlanner =
    (DepartureStation -> IntermediateTransferStation) ->
    EstimatedTravelDuration ->
        FinalDestination

type alias EffectfulPlanner =
    DepartureStation ->
    IntermediateTransferStation ->
    EstimatedTravelDuration ->
        FinalDestination \ IO

type alias CommentedPlanner =
    DepartureStation ->  // transfer station follows
    IntermediateTransferStation ->
    EstimatedTravelDuration ->
        FinalDestination

type alias Compact = String -> Int32

def makePlanner(): DepartureStation ->
    IntermediateTransferStation ->
    EstimatedTravelDuration ->
        FinalDestination =
    _departure -> _transfer -> _duration -> "Destination"
```

```flix printWidth=129
type alias DepartureStation = String
type alias IntermediateTransferStation = String
type alias EstimatedTravelDuration = Int32
type alias FinalDestination = String
type alias JourneyPlanner = DepartureStation -> IntermediateTransferStation -> EstimatedTravelDuration -> FinalDestination

type alias NestedPlanner = (DepartureStation -> IntermediateTransferStation) -> EstimatedTravelDuration -> FinalDestination

type alias EffectfulPlanner = DepartureStation -> IntermediateTransferStation -> EstimatedTravelDuration -> FinalDestination \ IO

type alias CommentedPlanner =
    DepartureStation ->  // transfer station follows
    IntermediateTransferStation ->
    EstimatedTravelDuration ->
        FinalDestination

type alias Compact = String -> Int32

def makePlanner(): DepartureStation -> IntermediateTransferStation -> EstimatedTravelDuration -> FinalDestination =
    _departure -> _transfer -> _duration -> "Destination"
```
