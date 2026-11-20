---
title: Keep a guarded match arm together at the width boundary
description: "The case pattern and guard fit exactly at 59 columns. At 58 columns the guard wraps. The body starts below the arrow at both widths."
flix: "0.80"
options: { printWidth: 59 }
---

## Input

```flix
def fare(routeServed: Bool, stationOpen: Bool, lastConnectionAvailable: Bool, eligibleForDiscount: Bool): String = match routeServed {
case true if stationOpen and lastConnectionAvailable => if (eligibleForDiscount) "discounted" else "full fare"
case _ => "unavailable"
}
```

## Output

```flix
def fare(
    routeServed: Bool,
    stationOpen: Bool,
    lastConnectionAvailable: Bool,
    eligibleForDiscount: Bool
): String = match routeServed {
    case true if stationOpen and lastConnectionAvailable =>
        if (eligibleForDiscount)
            "discounted"
        else
            "full fare"
    case _ => "unavailable"
}
```

```flix printWidth=58
def fare(
    routeServed: Bool,
    stationOpen: Bool,
    lastConnectionAvailable: Bool,
    eligibleForDiscount: Bool
): String = match routeServed {
    case true if stationOpen and
        lastConnectionAvailable =>
        if (eligibleForDiscount)
            "discounted"
        else
            "full fare"
    case _ => "unavailable"
}
```
