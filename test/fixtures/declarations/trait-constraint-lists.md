---
title: "Wrap long trait constraint lists between constraints"
description: "Keep each constraint together when a long with clause wraps."
flix: "0.80"
options: { printWidth: 60 }
---

## Input

```flix
pub def render[a: Type, b: Type, c: Type, d: Type](first: a, second: b, third: c, fourth: d): String with ToString[a], ToString[b], ToString[c], ToString[d] =
    ToString.toString(first) + ToString.toString(second) + ToString.toString(third) + ToString.toString(fourth)

pub def same[a: Type](first: a, second: a): Bool with Eq[a], // equality comes first
    ToString[a] =
    if (first == second) ToString.toString(first) != "" else false

pub trait ValueFormat[a: Type] with ToString[a], Eq[a], Hash[a] {}
```

## Output

```flix
pub def render[a: Type, b: Type, c: Type, d: Type] (
    first: a,
    second: b,
    third: c,
    fourth: d
): String with
    ToString[a],
    ToString[b],
    ToString[c],
    ToString[d] =
    ToString.toString(first) +
        ToString.toString(second) +
        ToString.toString(third) +
        ToString.toString(fourth)

pub def same[a: Type] (first: a, second: a): Bool with
    Eq[a],  // equality comes first
    ToString[a] =
    if (first == second)
        ToString.toString(first) != ""
    else
        false

pub trait ValueFormat[a: Type] with
    ToString[a],
    Eq[a],
    Hash[a] {}
```

```flix printWidth=100
pub def render[a: Type, b: Type, c: Type, d: Type] (first: a, second: b, third: c, fourth: d):
    String with ToString[a], ToString[b], ToString[c], ToString[d] =
    ToString.toString(first) +
        ToString.toString(second) +
        ToString.toString(third) +
        ToString.toString(fourth)

pub def same[a: Type] (first: a, second: a): Bool with
    Eq[a],  // equality comes first
    ToString[a] = if (first == second) ToString.toString(first) != "" else false

pub trait ValueFormat[a: Type] with ToString[a], Eq[a], Hash[a] {}
```

```flix printWidth=160
pub def render[a: Type, b: Type, c: Type, d: Type] (first: a, second: b, third: c, fourth: d): String with ToString[a], ToString[b], ToString[c], ToString[d] =
    ToString.toString(first) + ToString.toString(second) + ToString.toString(third) + ToString.toString(fourth)

pub def same[a: Type] (first: a, second: a): Bool with
    Eq[a],  // equality comes first
    ToString[a] = if (first == second) ToString.toString(first) != "" else false

pub trait ValueFormat[a: Type] with ToString[a], Eq[a], Hash[a] {}
```
