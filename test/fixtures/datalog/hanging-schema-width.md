---
title: Fit the row tail and opener in a hanging schema
description: The return schema hangs when the last row fits with its tail and the body opener. A narrower width uses regular schema indentation and can break before the pipe.
flix: "0.80"
---

## Input

```flix
mod Transit {
    def withAncestors(): #{ ParentOf(String, String), AncestorOf(String, String) | veryLongRowVariableName } = #{
        AncestorOf(x, y) :- ParentOf(x, y).
    }
}
```

## Output

```flix
mod Transit {
    def withAncestors(): #{
        ParentOf(String, String),
        AncestorOf(String, String) | veryLongRowVariableName
    } = #{
        AncestorOf(x, y) :- ParentOf(x, y).
    }
}
```

```flix printWidth=86
mod Transit {
    def withAncestors(): #{
        ParentOf(String, String),
        AncestorOf(String, String) | veryLongRowVariableName
    } = #{
        AncestorOf(x, y) :- ParentOf(x, y).
    }
}
```

```flix printWidth=59
mod Transit {
    def withAncestors(): #{
        ParentOf(String, String),
        AncestorOf(String, String)
        | veryLongRowVariableName
    } = #{
        AncestorOf(x, y) :- ParentOf(x, y).
    }
}
```
