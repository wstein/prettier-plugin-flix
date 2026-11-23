---
title: "Wrap open row types before the pipe"
description: "Keep a short last field or predicate intact when its record or Datalog row tail has to wrap."
options: { printWidth: 60 }
---

## Input

```flix
type alias JourneyRow[remainingJourneyFieldsBeforeServiceChange: RecordRow] = (departureStationName = String, estimatedTravelMinutes = Int32 | remainingJourneyFieldsBeforeServiceChange)

type alias JourneySchema[additionalDatalogPredicatesBeforeServiceChange: SchemaRow] = #(DepartureStation(String), EstimatedTravelMinutes(Int32) | additionalDatalogPredicatesBeforeServiceChange)

def preserve[additionalDatalogPredicatesBeforeServiceChange: SchemaRow](rules: #{ DepartureStation(String), EstimatedTravelMinutes(Int32) | additionalDatalogPredicatesBeforeServiceChange }): #{ DepartureStation(String), EstimatedTravelMinutes(Int32) | additionalDatalogPredicatesBeforeServiceChange } = rules

type alias CommentedRow[r: RecordRow] = (name = String, description = String /* keep the remaining fields */ | r)

type alias CommentedSchema[r: SchemaRow] = #(Stop(String), Platform(Int32) /* keep the remaining predicates */ | r)

type alias CommentedSchemaType[r: SchemaRow] = #{ Stop(String), Platform(Int32) /* keep all previously defined predicates */ | r }

type alias CompactRow[r: RecordRow] = (name = String | r)

type alias CompactSchema[r: SchemaRow] = #(Stop(String) | r)

type alias EdgeRow[remainingFieldsOfTheStopRecordRow: RecordRow] = (name = String, platform = Int32 | remainingFieldsOfTheStopRecordRow)

type alias OverRow[remainingFieldsOfTheStopRecordRows: RecordRow] = (name = String, platform = Int32 | remainingFieldsOfTheStopRecordRows)

type alias NotedEdgeRow[remainingFieldsOfTheStopRecordRow: RecordRow] = (name = String, platform = Int32 | remainingFieldsOfTheStopRecordRow /* note */)
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

type alias CommentedSchema[r: SchemaRow] =
    #(
        Stop(String),
        Platform(
            Int32
        ) /* keep the remaining predicates */ | r
    )

type alias CommentedSchemaType[r: SchemaRow] = #{
    Stop(String),
    Platform(
        Int32
    ) /* keep all previously defined predicates */ | r
}

type alias CompactRow[r: RecordRow] = (name = String | r)

type alias CompactSchema[r: SchemaRow] = #(Stop(String) | r)

type alias EdgeRow[
    remainingFieldsOfTheStopRecordRow: RecordRow
] =
    (
        name = String,
        platform = Int32 | remainingFieldsOfTheStopRecordRow
    )

type alias OverRow[
    remainingFieldsOfTheStopRecordRows: RecordRow
] =
    (
        name = String,
        platform = Int32
        | remainingFieldsOfTheStopRecordRows
    )

type alias NotedEdgeRow[
    remainingFieldsOfTheStopRecordRow: RecordRow
] =
    (
        name = String,
        platform = Int32
        | remainingFieldsOfTheStopRecordRow /* note */
    )
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

type alias CommentedSchema[r: SchemaRow] =
    #(Stop(String), Platform(Int32) /* keep the remaining predicates */ | r)

type alias CommentedSchemaType[r: SchemaRow] = #{
    Stop(String),
    Platform(Int32) /* keep all previously defined predicates */ | r
}

type alias CompactRow[r: RecordRow] = (name = String | r)

type alias CompactSchema[r: SchemaRow] = #(Stop(String) | r)

type alias EdgeRow[remainingFieldsOfTheStopRecordRow: RecordRow] =
    (name = String, platform = Int32 | remainingFieldsOfTheStopRecordRow)

type alias OverRow[remainingFieldsOfTheStopRecordRows: RecordRow] =
    (name = String, platform = Int32 | remainingFieldsOfTheStopRecordRows)

type alias NotedEdgeRow[remainingFieldsOfTheStopRecordRow: RecordRow] =
    (
        name = String,
        platform = Int32 | remainingFieldsOfTheStopRecordRow /* note */
    )
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

type alias CommentedSchema[r: SchemaRow] =
    #(Stop(String), Platform(Int32) /* keep the remaining predicates */ | r)

type alias CommentedSchemaType[r: SchemaRow] = #{
    Stop(String),
    Platform(Int32) /* keep all previously defined predicates */ | r
}

type alias CompactRow[r: RecordRow] = (name = String | r)

type alias CompactSchema[r: SchemaRow] = #(Stop(String) | r)

type alias EdgeRow[remainingFieldsOfTheStopRecordRow: RecordRow] =
    (name = String, platform = Int32 | remainingFieldsOfTheStopRecordRow)

type alias OverRow[remainingFieldsOfTheStopRecordRows: RecordRow] =
    (name = String, platform = Int32 | remainingFieldsOfTheStopRecordRows)

type alias NotedEdgeRow[remainingFieldsOfTheStopRecordRow: RecordRow] =
    (name = String, platform = Int32 | remainingFieldsOfTheStopRecordRow /* note */)
```
