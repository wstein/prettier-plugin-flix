---
title: "Record braces have no inner padding"
description: "Record types, literals, patterns and updates print as `{x = T}` with no space after `{` or before `}`. Effect sets and schema braces keep a space. An open record that starts with `|` keeps `{ | a}`."
group: "Expressions"
flix: "0.80"
options: { printWidth: 80 }
---

## Input

```flix
def typed(r: { x = Int32, y = String | a }): Int32 = r#x
def lit(): { x = Int32, y = String } = { x = 1, y = "a" }
def upd(r: { x = Int32 | a }): { x = Int32 | a } = { x = 2 | r }
def pat(r: { x = Int32 | a }): Int32 = match r {
    case { x = n | _ } => n
}
def open(r: { | a }): Int32 = 1
def effect(): Unit \ { Chan, NonDet } = ()
def schema(x: #{ A(Int32) }): Unit = ()
```

## Output

```flix
def typed(r: {x = Int32, y = String | a}): Int32 = r#x
def lit(): {x = Int32, y = String} = {x = 1, y = "a"}
def upd(r: {x = Int32 | a}): {x = Int32 | a} = {x = 2 | r}
def pat(r: {x = Int32 | a}): Int32 = match r {
    case {x = n | _} => n
}
def open(r: { | a }): Int32 = 1
def effect(): Unit \ { Chan, NonDet } = ()
def schema(x: #{ A(Int32) }): Unit = ()
```
