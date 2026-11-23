---
title: Tokens whose meaning depends on surrounding whitespace
description: "One example checks the tight qualifier and field-access arrow alongside a spaced lambda arrow."
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
