---
title: "Wrap open row types before the pipe"
description: "Keep a short last field or predicate intact when its record or Datalog row tail has to wrap."
flix: "0.80"
options: { printWidth: 60 }
---

## Input

```flix
type alias JourneyRow[remainingJourneyFieldsBeforeServiceChange: RecordRow] = (departureStationName = String, estimatedTravelMinutes = Int32 | remainingJourneyFieldsBeforeServiceChange)

type alias JourneySchema[additionalDatalogPredicatesBeforeServiceChange: SchemaRow] = #(DepartureStation(String), EstimatedTravelMinutes(Int32) | additionalDatalogPredicatesBeforeServiceChange)

def preserve[additionalDatalogPredicatesBeforeServiceChange: SchemaRow](rules: #{ DepartureStation(String), EstimatedTravelMinutes(Int32) | additionalDatalogPredicatesBeforeServiceChange }): #{ DepartureStation(String), EstimatedTravelMinutes(Int32) | additionalDatalogPredicatesBeforeServiceChange } = rules

type alias CommentedRow[r: RecordRow] = (name = String, description = String /* keep the remaining fields */ | r)

type alias CompactRow[r: RecordRow] = (name = String | r)

type alias CompactSchema[r: SchemaRow] = #(Stop(String) | r)
```

## Output

```flix
type alias JourneyRow[
    remainingJourneyFieldsBeforeServiceChange: RecordRow
] =
    (
        departureStationName = String,
        estimatedTravelMinutes = Int32
        | remainingJourneyFieldsBeforeServiceChange
    )

type alias JourneySchema[
    additionalDatalogPredicatesBeforeServiceChange: SchemaRow
] =
    #(
        DepartureStation(String),
        EstimatedTravelMinutes(Int32)
        | additionalDatalogPredicatesBeforeServiceChange
    )

def preserve[
    additionalDatalogPredicatesBeforeServiceChange: SchemaRow
] (rules: #{
    DepartureStation(String),
    EstimatedTravelMinutes(Int32)
    | additionalDatalogPredicatesBeforeServiceChange
}): #{
    DepartureStation(String),
    EstimatedTravelMinutes(Int32)
    | additionalDatalogPredicatesBeforeServiceChange
} = rules

type alias CommentedRow[r: RecordRow] =
    (
        name = String,
        description = String /* keep the remaining fields */ | r
    )

type alias CompactRow[r: RecordRow] = (name = String | r)

type alias CompactSchema[r: SchemaRow] = #(Stop(String) | r)
```

```flix printWidth=80
type alias JourneyRow[remainingJourneyFieldsBeforeServiceChange: RecordRow] =
    (
        departureStationName = String,
        estimatedTravelMinutes = Int32
        | remainingJourneyFieldsBeforeServiceChange
    )

type alias JourneySchema[
    additionalDatalogPredicatesBeforeServiceChange: SchemaRow
] =
    #(
        DepartureStation(String),
        EstimatedTravelMinutes(Int32)
        | additionalDatalogPredicatesBeforeServiceChange
    )

def preserve[
    additionalDatalogPredicatesBeforeServiceChange: SchemaRow
] (rules: #{
    DepartureStation(String),
    EstimatedTravelMinutes(Int32)
    | additionalDatalogPredicatesBeforeServiceChange
}): #{
    DepartureStation(String),
    EstimatedTravelMinutes(Int32)
    | additionalDatalogPredicatesBeforeServiceChange
} = rules

type alias CommentedRow[r: RecordRow] =
    (name = String, description = String /* keep the remaining fields */ | r)

type alias CompactRow[r: RecordRow] = (name = String | r)

type alias CompactSchema[r: SchemaRow] = #(Stop(String) | r)
```

```flix printWidth=100
type alias JourneyRow[remainingJourneyFieldsBeforeServiceChange: RecordRow] =
    (
        departureStationName = String,
        estimatedTravelMinutes = Int32 | remainingJourneyFieldsBeforeServiceChange
    )

type alias JourneySchema[additionalDatalogPredicatesBeforeServiceChange: SchemaRow] =
    #(
        DepartureStation(String),
        EstimatedTravelMinutes(Int32) | additionalDatalogPredicatesBeforeServiceChange
    )

def preserve[additionalDatalogPredicatesBeforeServiceChange: SchemaRow] (rules: #{
    DepartureStation(String),
    EstimatedTravelMinutes(Int32) | additionalDatalogPredicatesBeforeServiceChange
}): #{
    DepartureStation(String),
    EstimatedTravelMinutes(Int32) | additionalDatalogPredicatesBeforeServiceChange
} = rules

type alias CommentedRow[r: RecordRow] =
    (name = String, description = String /* keep the remaining fields */ | r)

type alias CompactRow[r: RecordRow] = (name = String | r)

type alias CompactSchema[r: SchemaRow] = #(Stop(String) | r)
```
