---
title: A newline string segment in a match-guard plus chain wraps at the guard indent
description: "A plus-only guard whose chain contains a \"\\n\" literal keeps the segment break and the deeper guard continuation. A wrapped head segment before the newline literal keeps the head on its own group."
group: "Operators"
flix: "0.80"
options: { printWidth: 70 }
---

## Input

```flix
def f(flag: Bool, leftLabel: String, midLabel: String, rightLabel: String): String = match flag {
    case true if leftLabel + "\n" + midLabel + rightLabel + leftLabel + midLabel != "" => leftLabel
    case false if leftLabel + rightLabel + midLabel + leftLabel + rightLabel + midLabel + "\n" + midLabel != "" => rightLabel
    case _ => midLabel
}
```

## Output

```flix
def f(
    flag: Bool,
    leftLabel: String,
    midLabel: String,
    rightLabel: String
): String = match flag {
    case true if leftLabel + "\n" +
            midLabel + rightLabel + leftLabel + midLabel !=
            "" => leftLabel
    case false if leftLabel +
            rightLabel +
            midLabel +
            leftLabel +
            rightLabel +
            midLabel +
            "\n" +
            midLabel !=
            "" => rightLabel
    case _ => midLabel
}
```
