---
title: A comment right after an opening brace stays inside empty braces
flix: "0.80"
---

## Input

```flix
def e(): #{ A(Int32) } = #{ // c
}
```

## Output

```flix
def e(): #{ A(Int32) } = #{ // c
}
```
