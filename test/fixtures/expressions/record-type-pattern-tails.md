---
title: "Wrap open record types and patterns before the pipe"
description: "Keep a short record tail with the final field and wrap long tails before the pipe."
flix: "0.80"
options: { printWidth: 60 }
---

## Input

```flix
def station(journey: { departureStationName = String, estimatedTravelMinutes = Int32 | remainingJourneyFieldsBeforeServiceChange }): String =
    journey#departureStationName

def fromPattern(journey: { departureStationName = String, estimatedTravelMinutes = Int32 | r }): String =
    match journey {
        case { departureStationName = name, estimatedTravelMinutes = _duration | _remainingJourneyDetailsBeforeServiceChange } => name
    }

def compact(r: { name = String | a }): String = match r {
    case { name | _ } => name
}

def commented(r: { name = String // keep the name field
    | a }): String = r#name

def blockCommented(r: { departureStationName = String, estimatedTravelMinutes = Int32 /* tail */ | remainingJourneyFields }): String = r#departureStationName

def pipeCommented(r: { name = String | // keep the tail
    a }): String = match r {
    case { name = n | /* rest */ _ } => n
}

def eighty(r: { departureStationName = String, estimatedTravelMinutes = Int32 | tailFitsAtEightyxxxxxxxxxxxxxxxxxxxxxxxxxxx }): String = r#departureStationName

def eightyOne(r: { departureStationName = String, estimatedTravelMinutes = Int32 | tailFitsAtEightyxxxxxxxxxxxxxxxxxxxxxxxxxxxy }): String = r#departureStationName

def patternCommented(journey: { departureStationName = String, estimatedTravelMinutes = Int32 | r }): String = match journey {
    case { departureStationName = name, estimatedTravelMinutes = _duration /* c */ | _remainingJourneyDetailsBeforeServiceChange } => name
}

def ownLineCommented(r: { departureStationName = String, estimatedTravelMinutes = Int32
    // own line before the pipe
    | remainingJourneyFieldsBeforeServiceChange }): String = r#departureStationName
```

## Output

```flix
def station(journey: {
    departureStationName = String,
    estimatedTravelMinutes = Int32
    | remainingJourneyFieldsBeforeServiceChange
}): String = journey#departureStationName

def fromPattern(journey: {
    departureStationName = String,
    estimatedTravelMinutes = Int32 | r
}): String =
    match journey {
        case {
            departureStationName = name,
            estimatedTravelMinutes = _duration
            | _remainingJourneyDetailsBeforeServiceChange
        } => name
    }

def compact(r: { name = String | a }): String = match r {
    case { name | _ } => name
}

def commented(r: {
    name = String  // keep the name field
    | a
}): String = r#name

def blockCommented(r: {
    departureStationName = String,
    estimatedTravelMinutes = Int32 /* tail */ | remainingJourneyFields
}): String = r#departureStationName

def pipeCommented(r: {
    name = String |  // keep the tail
    a
}): String = match r {
    case { name = n | /* rest */ _ } => n
}

def eighty(r: {
    departureStationName = String,
    estimatedTravelMinutes = Int32
    | tailFitsAtEightyxxxxxxxxxxxxxxxxxxxxxxxxxxx
}): String = r#departureStationName

def eightyOne(r: {
    departureStationName = String,
    estimatedTravelMinutes = Int32
    | tailFitsAtEightyxxxxxxxxxxxxxxxxxxxxxxxxxxxy
}): String = r#departureStationName

def patternCommented(journey: {
    departureStationName = String,
    estimatedTravelMinutes = Int32 | r
}): String = match journey {
    case {
        departureStationName = name,
        estimatedTravelMinutes = _duration /* c */ | _remainingJourneyDetailsBeforeServiceChange
    } => name
}

def ownLineCommented(r: {
    departureStationName = String,
    estimatedTravelMinutes = Int32
    // own line before the pipe
    | remainingJourneyFieldsBeforeServiceChange
}): String = r#departureStationName
```

```flix printWidth=80
def station(journey: {
    departureStationName = String,
    estimatedTravelMinutes = Int32 | remainingJourneyFieldsBeforeServiceChange
}): String = journey#departureStationName

def fromPattern(journey: {
    departureStationName = String,
    estimatedTravelMinutes = Int32 | r
}): String =
    match journey {
        case {
            departureStationName = name,
            estimatedTravelMinutes = _duration
            | _remainingJourneyDetailsBeforeServiceChange
        } => name
    }

def compact(r: { name = String | a }): String = match r {
    case { name | _ } => name
}

def commented(r: {
    name = String  // keep the name field
    | a
}): String = r#name

def blockCommented(r: {
    departureStationName = String,
    estimatedTravelMinutes = Int32 /* tail */ | remainingJourneyFields
}): String = r#departureStationName

def pipeCommented(r: {
    name = String |  // keep the tail
    a
}): String = match r {
    case { name = n | /* rest */ _ } => n
}

def eighty(r: {
    departureStationName = String,
    estimatedTravelMinutes = Int32 | tailFitsAtEightyxxxxxxxxxxxxxxxxxxxxxxxxxxx
}): String = r#departureStationName

def eightyOne(r: {
    departureStationName = String,
    estimatedTravelMinutes = Int32
    | tailFitsAtEightyxxxxxxxxxxxxxxxxxxxxxxxxxxxy
}): String = r#departureStationName

def patternCommented(journey: {
    departureStationName = String,
    estimatedTravelMinutes = Int32 | r
}): String = match journey {
    case {
        departureStationName = name,
        estimatedTravelMinutes = _duration /* c */ | _remainingJourneyDetailsBeforeServiceChange
    } => name
}

def ownLineCommented(r: {
    departureStationName = String,
    estimatedTravelMinutes = Int32
    // own line before the pipe
    | remainingJourneyFieldsBeforeServiceChange
}): String = r#departureStationName
```

```flix printWidth=100
def station(journey: {
    departureStationName = String,
    estimatedTravelMinutes = Int32 | remainingJourneyFieldsBeforeServiceChange
}): String = journey#departureStationName

def fromPattern(journey: {
    departureStationName = String,
    estimatedTravelMinutes = Int32 | r
}): String =
    match journey {
        case {
            departureStationName = name,
            estimatedTravelMinutes = _duration | _remainingJourneyDetailsBeforeServiceChange
        } => name
    }

def compact(r: { name = String | a }): String = match r {
    case { name | _ } => name
}

def commented(r: {
    name = String  // keep the name field
    | a
}): String = r#name

def blockCommented(r: {
    departureStationName = String,
    estimatedTravelMinutes = Int32 /* tail */ | remainingJourneyFields
}): String = r#departureStationName

def pipeCommented(r: {
    name = String |  // keep the tail
    a
}): String = match r {
    case { name = n | /* rest */ _ } => n
}

def eighty(r: {
    departureStationName = String,
    estimatedTravelMinutes = Int32 | tailFitsAtEightyxxxxxxxxxxxxxxxxxxxxxxxxxxx
}): String = r#departureStationName

def eightyOne(r: {
    departureStationName = String,
    estimatedTravelMinutes = Int32 | tailFitsAtEightyxxxxxxxxxxxxxxxxxxxxxxxxxxxy
}): String = r#departureStationName

def patternCommented(journey: {
    departureStationName = String,
    estimatedTravelMinutes = Int32 | r
}): String = match journey {
    case {
        departureStationName = name,
        estimatedTravelMinutes = _duration /* c */ | _remainingJourneyDetailsBeforeServiceChange
    } => name
}

def ownLineCommented(r: {
    departureStationName = String,
    estimatedTravelMinutes = Int32
    // own line before the pipe
    | remainingJourneyFieldsBeforeServiceChange
}): String = r#departureStationName
```
