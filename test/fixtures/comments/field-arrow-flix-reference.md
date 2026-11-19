---
title: A field-access arrow followed by a line comment in a complete module
flix: "0.80"
flixFormat: "0.80.0"
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

Flix v0.80.0 inserts a space after the arrow, changing its lexer class.

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
