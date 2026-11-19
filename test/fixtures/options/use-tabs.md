---
title: Indent nested blocks with tabs
description: The default uses spaces. The alternate emits literal tabs at each nesting level.
flix: "0.80"
---

## Input

```flix
def pickValue(flag: Bool): Int32 = {
if (flag) {
10
} else {
20
}
}
```

## Output

```flix
def pickValue(flag: Bool): Int32 = {
    if (flag) {
        10
    } else {
        20
    }
}
```

```flix useTabs=true
def pickValue(flag: Bool): Int32 = {
	if (flag) {
		10
	} else {
		20
	}
}
```
