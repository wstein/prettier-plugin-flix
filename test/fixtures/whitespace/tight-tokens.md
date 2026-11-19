---
title: Tokens whose meaning depends on surrounding whitespace
flix: "0.80"
---

## Input

```flix
use Foo::Bar.{baz,qux}
def f(s: S[r]): Int32 \ IO = s->field + (x -> x)(1)
```

## Output

```flix
use Foo::Bar.{baz, qux}

def f(s: S[r]): Int32 \ IO = s->field + (x -> x)(1)
```
