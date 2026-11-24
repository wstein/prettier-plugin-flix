---
title: "Wrap long trait constraint lists between constraints"
description: "Keep each constraint together when a long with clause wraps."
options: { printWidth: 60 }
---

## Input

```flix
pub def render[a: Type, b: Type, c: Type, d: Type](first: a, second: b, third: c, fourth: d): String with ToString[a], ToString[b], ToString[c], ToString[d] =
    ToString.toString(first) + ToString.toString(second) + ToString.toString(third) + ToString.toString(fourth)

pub def same[a: Type](first: a, second: a): Bool with Eq[a], // equality comes first
    ToString[a] =
    if (first == second) ToString.toString(first) != "" else false

pub def tagged[a: Type](first: a): String with // both constraints
    ToString[a], Hash[a] = ToString.toString(first)

pub def notes[a: Type](first: a, second: a): String with
    // shown first
    ToString[a] // before the comma
    , // after the comma
    Hash[a] = ToString.toString(first) + ToString.toString(second)

pub trait ValueFormat[a: Type] with ToString[a], Eq[a], Hash[a] {}

enum Box[a] {
    case Box(a)
}

instance Eq[Box[a]] with Eq[a], Hash[a], ToString[a], Order[a], LowerBound[a] {
    pub def eq(x: Box[a], y: Box[a]): Bool = ???
}
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
    ToString.toString(first)
        + ToString.toString(second)
        + ToString.toString(third)
        + ToString.toString(fourth)

pub def same[a: Type] (first: a, second: a): Bool with
    Eq[a],  // equality comes first
    ToString[a] =
    if (first == second)
        ToString.toString(first) != ""
    else
        false

pub def tagged[a: Type] (first: a): String with  // both constraints
    ToString[a],
    Hash[a] = ToString.toString(first)

pub def notes[a: Type] (first: a, second: a): String with
    // shown first
    ToString[a],  // before the comma
    // after the comma
    Hash[a] =
    ToString.toString(first) + ToString.toString(second)

pub trait ValueFormat[a: Type] with
    ToString[a],
    Eq[a],
    Hash[a] {}

enum Box[a] {
    case Box(a)
}

instance Eq[Box[a]] with
    Eq[a],
    Hash[a],
    ToString[a],
    Order[a],
    LowerBound[a] {
    pub def eq(x: Box[a], y: Box[a]): Bool = ???
}
```

```flix printWidth=40
pub def render[
    a: Type,
    b: Type,
    c: Type,
    d: Type
] (
    first: a,
    second: b,
    third: c,
    fourth: d
): String with
    ToString[a],
    ToString[b],
    ToString[c],
    ToString[d] =
    ToString.toString(first)
        + ToString.toString(second)
        + ToString.toString(third)
        + ToString.toString(fourth)

pub def same[a: Type] (
    first: a,
    second: a
): Bool with
    Eq[a],  // equality comes first
    ToString[a] =
    if (first == second)
        ToString.toString(first) != ""
    else
        false

pub def tagged[a: Type] (
    first: a
): String with  // both constraints
    ToString[a],
    Hash[a] = ToString.toString(first)

pub def notes[a: Type] (
    first: a,
    second: a
): String with
    // shown first
    ToString[a],  // before the comma
    // after the comma
    Hash[a] =
    ToString.toString(first)
        + ToString.toString(second)

pub trait ValueFormat[a: Type] with
    ToString[a],
    Eq[a],
    Hash[a] {}

enum Box[a] {
    case Box(a)
}

instance Eq[Box[a]] with
    Eq[a],
    Hash[a],
    ToString[a],
    Order[a],
    LowerBound[a] {
    pub def eq(
        x: Box[a],
        y: Box[a]
    ): Bool = ???
}
```

```flix printWidth=100
pub def render[a: Type, b: Type, c: Type, d: Type] (first: a, second: b, third: c, fourth: d):
    String with ToString[a], ToString[b], ToString[c], ToString[d] =
    ToString.toString(first)
        + ToString.toString(second)
        + ToString.toString(third)
        + ToString.toString(fourth)

pub def same[a: Type] (first: a, second: a): Bool with
    Eq[a],  // equality comes first
    ToString[a] = if (first == second) ToString.toString(first) != "" else false

pub def tagged[a: Type] (first: a): String with  // both constraints
    ToString[a],
    Hash[a] = ToString.toString(first)

pub def notes[a: Type] (first: a, second: a): String with
    // shown first
    ToString[a],  // before the comma
    // after the comma
    Hash[a] = ToString.toString(first) + ToString.toString(second)

pub trait ValueFormat[a: Type] with ToString[a], Eq[a], Hash[a] {}

enum Box[a] {
    case Box(a)
}

instance Eq[Box[a]] with Eq[a], Hash[a], ToString[a], Order[a], LowerBound[a] {
    pub def eq(x: Box[a], y: Box[a]): Bool = ???
}
```

```flix printWidth=160
pub def render[a: Type, b: Type, c: Type, d: Type] (first: a, second: b, third: c, fourth: d): String with ToString[a], ToString[b], ToString[c], ToString[d] =
    ToString.toString(first) + ToString.toString(second) + ToString.toString(third) + ToString.toString(fourth)

pub def same[a: Type] (first: a, second: a): Bool with
    Eq[a],  // equality comes first
    ToString[a] = if (first == second) ToString.toString(first) != "" else false

pub def tagged[a: Type] (first: a): String with  // both constraints
    ToString[a],
    Hash[a] = ToString.toString(first)

pub def notes[a: Type] (first: a, second: a): String with
    // shown first
    ToString[a],  // before the comma
    // after the comma
    Hash[a] = ToString.toString(first) + ToString.toString(second)

pub trait ValueFormat[a: Type] with ToString[a], Eq[a], Hash[a] {}

enum Box[a] {
    case Box(a)
}

instance Eq[Box[a]] with Eq[a], Hash[a], ToString[a], Order[a], LowerBound[a] {
    pub def eq(x: Box[a], y: Box[a]): Bool = ???
}
```
