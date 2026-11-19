---
title: A comment right after an opening brace stays inside empty braces
description: "Even without expressions inside the braces, the comment must stay inside the block."
group: "Calls, blocks, and control flow"
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
