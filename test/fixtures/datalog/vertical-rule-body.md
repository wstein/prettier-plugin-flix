---
title: Preserve vertical Datalog rule bodies
description: "Source-written predicate lines remain separate at wider widths, while compact rules still wrap as needed."
flix: "0.80"
---

## Input

```flix
def routes() = #{
    Link("Library", "Station").
    Link("Station", "Park").

    Reachable(a, b) :- Link(a, b).
    Reachable(a, b) :-
        Link(a, middle),
        Reachable(middle, b).
    TwoHop(a, b) :- Link(a, middle), Link(middle, b).
    Guarded(a, b) :-
        Link(a, b), // require a useful link
        if (a != b).
}
```

## Output

```flix
def routes() = #{
    Link("Library", "Station").
    Link("Station", "Park").

    Reachable(a, b) :- Link(a, b).
    Reachable(a, b) :-
        Link(a, middle),
        Reachable(middle, b).
    TwoHop(a, b) :- Link(a, middle), Link(middle, b).
    Guarded(a, b) :-
        Link(a, b),  // require a useful link
        if (a != b).
}
```

```flix printWidth=44
def routes() = #{
    Link("Library", "Station").
    Link("Station", "Park").

    Reachable(a, b) :- Link(a, b).
    Reachable(a, b) :-
        Link(a, middle),
        Reachable(middle, b).
    TwoHop(a, b) :-
        Link(a, middle), Link(middle, b).
    Guarded(a, b) :-
        Link(a, b),  // require a useful link
        if (a != b).
}
```
