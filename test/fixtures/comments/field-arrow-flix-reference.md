---
title: A field-access arrow followed by a line comment in a complete module
flix: "0.80"
flixFormat: "0.80.0"
flixFormatInvalid: true
---

## Input

```flix
mod Reference {
    struct Person[r] {
        fstName: String
    }

    mod Person {
        pub def get(): String = region rc {
            let s = new Person @ rc { fstName = "Lucky" };
            s->// field access
            fstName
        }
    }
}
```

## Output

```flix
mod Reference {
    struct Person[r] {
        fstName: String
    }

    mod Person {
        pub def get(): String = region rc {
            let s = new Person @ rc { fstName = "Lucky" };
            s->// field access
            fstName
        }
    }
}
```

## Flix Format

Flix v0.80.0 inserts a space after the arrow, changing its lexer class. Rechecking the formatted file reports a type error (E6925) and an undefined name (E2136); the Flix Format Diagnostics section records both, so a change in them is reported.

```flix
mod Reference {
    struct Person[r] {
        fstName: String
    }

    mod Person {
        pub def get(): String = region rc {
            let s = new Person @ rc {fstName = "Lucky"};
            s-> // field access
            fstName
        }
    }
}
```

## Flix Format Diagnostics

```text
Type Error [E6925]: Unable to unify the function type 't0 -> t1 \ e2' with the non-function type 'String'.
Resolution Error [E2136]: Undefined name 'fstName'.
```
