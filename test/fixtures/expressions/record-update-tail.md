---
title: "Wrap long record updates before the pipe"
description: "Keep a short record update together and break before its base record when the last field and the base no longer fit."
flix: "0.80"
options: { printWidth: 60 }
---

## Input

```flix
def extend(previousJourneyDetailsBeforeServiceChange: { departureStationName = String, estimatedTravelMinutes = Int32 }): String = {
    let updated = {
        departureStationName = "Central Station",
        estimatedTravelMinutes = 35 | previousJourneyDetailsBeforeServiceChange
    };
    updated#departureStationName
}

def compact(original: { name = String }): String =
    { name = "Flix" | original }#name

def commented(original: { name = String }): String = {
    let updated = {
        name = "Flix" // add the display name
        | original
    };
    updated#name
}
```

## Output

```flix
def extend(previousJourneyDetailsBeforeServiceChange: {
    departureStationName = String,
    estimatedTravelMinutes = Int32
}): String = {
    let updated = {
        departureStationName = "Central Station",
        estimatedTravelMinutes = 35
        | previousJourneyDetailsBeforeServiceChange
    };
    updated#departureStationName
}

def compact(original: { name = String }): String =
    { name = "Flix" | original }#name

def commented(original: { name = String }): String = {
    let updated = {
        name = "Flix"  // add the display name
        | original
    };
    updated#name
}
```

```flix printWidth=80
def extend(previousJourneyDetailsBeforeServiceChange: {
    departureStationName = String,
    estimatedTravelMinutes = Int32
}): String = {
    let updated = {
        departureStationName = "Central Station",
        estimatedTravelMinutes = 35 | previousJourneyDetailsBeforeServiceChange
    };
    updated#departureStationName
}

def compact(original: { name = String }): String =
    { name = "Flix" | original }#name

def commented(original: { name = String }): String = {
    let updated = {
        name = "Flix"  // add the display name
        | original
    };
    updated#name
}
```

```flix printWidth=100
def extend(previousJourneyDetailsBeforeServiceChange: {
    departureStationName = String,
    estimatedTravelMinutes = Int32
}): String = {
    let updated = {
        departureStationName = "Central Station",
        estimatedTravelMinutes = 35 | previousJourneyDetailsBeforeServiceChange
    };
    updated#departureStationName
}

def compact(original: { name = String }): String = { name = "Flix" | original }#name

def commented(original: { name = String }): String = {
    let updated = {
        name = "Flix"  // add the display name
        | original
    };
    updated#name
}
```
