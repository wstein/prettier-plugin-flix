---
title: "Keep a return type arrow chain on one line when it fits"
description: "A return type arrow chain moves to its own continuation line as a whole, and a short with list follows on the next line in the same column."
group: "Types and constraints"
options: { printWidth: 80 }
---

## Input

```flix
pub def lift5(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): String -> String -> String -> String -> String -> String with Order[t1], Order[t2], Order[t3], Order[t4], Order[t5], Order[t] =
    _ -> _ -> _ -> _ -> _ -> ""

pub def lift2(_f: t1 -> t2 -> t): String -> String -> String with Order[t1], Order[t2], Order[t] =
    _ -> _ -> ""

pub def pick(_f: t1 -> t2 -> t3 -> t): Vector[String] -> Vector[String] -> Vector[String] with Order[t1] =
    _ -> _ -> Vector.empty()

pub def launch(_f: t1 -> t2 -> t3 -> t): Vector[String] -> Vector[String] -> Vector[String] \ IO with Order[t1] =
    _ -> _ -> Vector.empty()

pub def effectOnly(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): String -> String -> String -> String -> String -> String \ IO =
    _ -> _ -> _ -> _ -> _ -> ""

pub def noted(_f: t1 -> t2 -> t3 -> t): /* keep */ Vector[String] -> Vector[String] -> Vector[String] with Order[t1] =
    _ -> _ -> Vector.empty()

pub def edge(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[String] -> Vector[String] -> Vector[String] -> Vxxxxxxxxxxxxxxxxxxxxx with Order[t1] =
    _ -> _ -> _ -> Vector.empty()

pub def edge0(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[String] -> Vector[String] -> Vector[String] -> Vxxxxxxxxxxxxxxxxxxxxxx with Order[t1] =
    _ -> _ -> _ -> Vector.empty()

pub def edge5(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[String] -> Vector[String] -> Vector[String] -> Vxxxxxxxxxxxxxxxx with Order[t1], Order[t10], Order[t11], Order[t12], Order[t13], Order[t14], Order[t15] =
    _ -> _ -> _ -> Vector.empty()

pub def edge2(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[String] -> Vector[String] with Order[t1], Order[t10], Order[t11], Order[t12], Order[t13], Order[t14] =
    _ -> Vector.empty()

pub def edge3(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[String] -> Vector[String] with Order[t1], Order[t10], Order[t11], Order[t12], Order[t13], Order[t145] =
    _ -> Vector.empty()

mod Outer {
    pub def edge(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[String] -> Vector[String] -> Vector[String] -> Vxxxxxxxxxxxxxxxxxxxxx with Order[t1] =
        _ -> _ -> _ -> Vector.empty()

    mod Inner {
        pub def lift5(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): String -> String -> String -> String -> String -> String with Order[t1], Order[t2], Order[t3], Order[t4], Order[t5], Order[t] =
            _ -> _ -> _ -> _ -> _ -> ""
    }
}
```

## Output

```flix
pub def lift5(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t):
    String -> String -> String -> String -> String -> String
    with Order[t1], Order[t2], Order[t3], Order[t4], Order[t5], Order[t] =
    _ -> _ -> _ -> _ -> _ -> ""

pub def lift2(_f: t1 -> t2 -> t): String -> String -> String
    with Order[t1], Order[t2], Order[t] = _ -> _ -> ""

pub def pick(_f: t1 -> t2 -> t3 -> t):
    Vector[String] -> Vector[String] -> Vector[String] with Order[t1] =
    _ -> _ -> Vector.empty()

pub def launch(_f: t1 -> t2 -> t3 -> t):
    Vector[String] -> Vector[String] -> Vector[String] \ IO with Order[t1] =
    _ -> _ -> Vector.empty()

pub def effectOnly(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t):
    String -> String -> String -> String -> String -> String \ IO =
    _ -> _ -> _ -> _ -> _ -> ""

pub def noted(_f: t1 -> t2 -> t3 -> t): /* keep */ Vector[String] ->
    Vector[String] ->
        Vector[String] with Order[t1] = _ -> _ -> Vector.empty()

pub def edge(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t):
    Vector[String] -> Vector[String] -> Vector[String] -> Vxxxxxxxxxxxxxxxxxxxxx
    with Order[t1] = _ -> _ -> _ -> Vector.empty()

pub def edge0(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[String] ->
    Vector[String] ->
    Vector[String] ->
        Vxxxxxxxxxxxxxxxxxxxxxx with Order[t1] = _ -> _ -> _ -> Vector.empty()

pub def edge5(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t):
    Vector[String] -> Vector[String] -> Vector[String] -> Vxxxxxxxxxxxxxxxx with
    Order[t1],
    Order[t10],
    Order[t11],
    Order[t12],
    Order[t13],
    Order[t14],
    Order[t15] = _ -> _ -> _ -> Vector.empty()

pub def edge2(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[String] ->
        Vector[String] with
    Order[t1],
    Order[t10],
    Order[t11],
    Order[t12],
    Order[t13],
    Order[t14] = _ -> Vector.empty()

pub def edge3(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[String] ->
        Vector[String] with
    Order[t1],
    Order[t10],
    Order[t11],
    Order[t12],
    Order[t13],
    Order[t145] = _ -> Vector.empty()

mod Outer {
    pub def edge(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[String] ->
        Vector[String] ->
        Vector[String] ->
            Vxxxxxxxxxxxxxxxxxxxxx with Order[t1] =
        _ -> _ -> _ -> Vector.empty()

    mod Inner {
        pub def lift5(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t):
            String -> String -> String -> String -> String -> String with
            Order[t1],
            Order[t2],
            Order[t3],
            Order[t4],
            Order[t5],
            Order[t] = _ -> _ -> _ -> _ -> _ -> ""
    }
}
```

```flix printWidth=60
pub def lift5(
    _f: t1 -> t2 -> t3 -> t4 -> t5 -> t
): String ->
    String ->
    String ->
    String ->
    String ->
        String with
    Order[t1],
    Order[t2],
    Order[t3],
    Order[t4],
    Order[t5],
    Order[t] = _ -> _ -> _ -> _ -> _ -> ""

pub def lift2(_f: t1 -> t2 -> t): String -> String -> String
    with Order[t1], Order[t2], Order[t] = _ -> _ -> ""

pub def pick(_f: t1 -> t2 -> t3 -> t):
    Vector[String] -> Vector[String] -> Vector[String]
    with Order[t1] = _ -> _ -> Vector.empty()

pub def launch(_f: t1 -> t2 -> t3 -> t):
    Vector[String] -> Vector[String] -> Vector[String]
    \ IO with Order[t1] = _ -> _ -> Vector.empty()

pub def effectOnly(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t):
    String -> String -> String -> String -> String -> String
    \ IO = _ -> _ -> _ -> _ -> _ -> ""

pub def noted(_f: t1 -> t2 -> t3 -> t): /* keep */ Vector[
    String
] -> Vector[String] -> Vector[String] with Order[t1] =
    _ -> _ -> Vector.empty()

pub def edge(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[
    String
] ->
    Vector[String] ->
    Vector[String] ->
        Vxxxxxxxxxxxxxxxxxxxxx with Order[t1] =
    _ -> _ -> _ -> Vector.empty()

pub def edge0(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[
    String
] ->
    Vector[String] ->
    Vector[String] ->
        Vxxxxxxxxxxxxxxxxxxxxxx with Order[t1] =
    _ -> _ -> _ -> Vector.empty()

pub def edge5(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[
    String
] ->
    Vector[String] ->
    Vector[String] ->
        Vxxxxxxxxxxxxxxxx with
    Order[t1],
    Order[t10],
    Order[t11],
    Order[t12],
    Order[t13],
    Order[t14],
    Order[t15] = _ -> _ -> _ -> Vector.empty()

pub def edge2(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[
    String
] -> Vector[String] with
    Order[t1],
    Order[t10],
    Order[t11],
    Order[t12],
    Order[t13],
    Order[t14] = _ -> Vector.empty()

pub def edge3(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[
    String
] -> Vector[String] with
    Order[t1],
    Order[t10],
    Order[t11],
    Order[t12],
    Order[t13],
    Order[t145] = _ -> Vector.empty()

mod Outer {
    pub def edge(
        _f: t1 -> t2 -> t3 -> t4 -> t5 -> t
    ): Vector[String] ->
        Vector[String] ->
        Vector[String] ->
            Vxxxxxxxxxxxxxxxxxxxxx with Order[t1] =
        _ -> _ -> _ -> Vector.empty()

    mod Inner {
        pub def lift5(
            _f: t1 -> t2 -> t3 -> t4 -> t5 -> t
        ): String ->
            String ->
            String ->
            String ->
            String ->
                String with
            Order[t1],
            Order[t2],
            Order[t3],
            Order[t4],
            Order[t5],
            Order[t] = _ -> _ -> _ -> _ -> _ -> ""
    }
}
```

```flix printWidth=70
pub def lift5(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t):
    String -> String -> String -> String -> String -> String with
    Order[t1],
    Order[t2],
    Order[t3],
    Order[t4],
    Order[t5],
    Order[t] = _ -> _ -> _ -> _ -> _ -> ""

pub def lift2(_f: t1 -> t2 -> t): String -> String -> String
    with Order[t1], Order[t2], Order[t] = _ -> _ -> ""

pub def pick(_f: t1 -> t2 -> t3 -> t):
    Vector[String] -> Vector[String] -> Vector[String]
    with Order[t1] = _ -> _ -> Vector.empty()

pub def launch(_f: t1 -> t2 -> t3 -> t):
    Vector[String] -> Vector[String] -> Vector[String]
    \ IO with Order[t1] = _ -> _ -> Vector.empty()

pub def effectOnly(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t):
    String -> String -> String -> String -> String -> String \ IO =
    _ -> _ -> _ -> _ -> _ -> ""

pub def noted(_f: t1 -> t2 -> t3 -> t): /* keep */ Vector[String] ->
    Vector[String] ->
        Vector[String] with Order[t1] = _ -> _ -> Vector.empty()

pub def edge(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[String] ->
    Vector[String] ->
    Vector[String] ->
        Vxxxxxxxxxxxxxxxxxxxxx with Order[t1] =
    _ -> _ -> _ -> Vector.empty()

pub def edge0(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[String] ->
    Vector[String] ->
    Vector[String] ->
        Vxxxxxxxxxxxxxxxxxxxxxx with Order[t1] =
    _ -> _ -> _ -> Vector.empty()

pub def edge5(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[String] ->
    Vector[String] ->
    Vector[String] ->
        Vxxxxxxxxxxxxxxxx with
    Order[t1],
    Order[t10],
    Order[t11],
    Order[t12],
    Order[t13],
    Order[t14],
    Order[t15] = _ -> _ -> _ -> Vector.empty()

pub def edge2(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[String] ->
        Vector[String] with
    Order[t1],
    Order[t10],
    Order[t11],
    Order[t12],
    Order[t13],
    Order[t14] = _ -> Vector.empty()

pub def edge3(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[String] ->
        Vector[String] with
    Order[t1],
    Order[t10],
    Order[t11],
    Order[t12],
    Order[t13],
    Order[t145] = _ -> Vector.empty()

mod Outer {
    pub def edge(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[
        String
    ] ->
        Vector[String] ->
        Vector[String] ->
            Vxxxxxxxxxxxxxxxxxxxxx with Order[t1] =
        _ -> _ -> _ -> Vector.empty()

    mod Inner {
        pub def lift5(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): String ->
            String ->
            String ->
            String ->
            String ->
                String with
            Order[t1],
            Order[t2],
            Order[t3],
            Order[t4],
            Order[t5],
            Order[t] = _ -> _ -> _ -> _ -> _ -> ""
    }
}
```

```flix printWidth=100
pub def lift5(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t):
    String -> String -> String -> String -> String -> String
    with Order[t1], Order[t2], Order[t3], Order[t4], Order[t5], Order[t] =
    _ -> _ -> _ -> _ -> _ -> ""

pub def lift2(_f: t1 -> t2 -> t): String -> String -> String with Order[t1], Order[t2], Order[t] =
    _ -> _ -> ""

pub def pick(_f: t1 -> t2 -> t3 -> t): Vector[String] -> Vector[String] -> Vector[String]
    with Order[t1] = _ -> _ -> Vector.empty()

pub def launch(_f: t1 -> t2 -> t3 -> t): Vector[String] -> Vector[String] -> Vector[String] \ IO
    with Order[t1] = _ -> _ -> Vector.empty()

pub def effectOnly(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t):
    String -> String -> String -> String -> String -> String \ IO = _ -> _ -> _ -> _ -> _ -> ""

pub def noted(_f: t1 -> t2 -> t3 -> t): /* keep */ Vector[String] ->
    Vector[String] ->
        Vector[String] with Order[t1] = _ -> _ -> Vector.empty()

pub def edge(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t):
    Vector[String] -> Vector[String] -> Vector[String] -> Vxxxxxxxxxxxxxxxxxxxxx with Order[t1] =
    _ -> _ -> _ -> Vector.empty()

pub def edge0(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t):
    Vector[String] -> Vector[String] -> Vector[String] -> Vxxxxxxxxxxxxxxxxxxxxxx with Order[t1] =
    _ -> _ -> _ -> Vector.empty()

pub def edge5(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t):
    Vector[String] -> Vector[String] -> Vector[String] -> Vxxxxxxxxxxxxxxxx
    with Order[t1], Order[t10], Order[t11], Order[t12], Order[t13], Order[t14], Order[t15] =
    _ -> _ -> _ -> Vector.empty()

pub def edge2(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[String] -> Vector[String]
    with Order[t1], Order[t10], Order[t11], Order[t12], Order[t13], Order[t14] = _ -> Vector.empty()

pub def edge3(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[String] -> Vector[String]
    with Order[t1], Order[t10], Order[t11], Order[t12], Order[t13], Order[t145] =
    _ -> Vector.empty()

mod Outer {
    pub def edge(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t):
        Vector[String] -> Vector[String] -> Vector[String] -> Vxxxxxxxxxxxxxxxxxxxxx
        with Order[t1] = _ -> _ -> _ -> Vector.empty()

    mod Inner {
        pub def lift5(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t):
            String -> String -> String -> String -> String -> String
            with Order[t1], Order[t2], Order[t3], Order[t4], Order[t5], Order[t] =
            _ -> _ -> _ -> _ -> _ -> ""
    }
}
```

```flix printWidth=120
pub def lift5(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): String -> String -> String -> String -> String -> String
    with Order[t1], Order[t2], Order[t3], Order[t4], Order[t5], Order[t] = _ -> _ -> _ -> _ -> _ -> ""

pub def lift2(_f: t1 -> t2 -> t): String -> String -> String with Order[t1], Order[t2], Order[t] = _ -> _ -> ""

pub def pick(_f: t1 -> t2 -> t3 -> t): Vector[String] -> Vector[String] -> Vector[String] with Order[t1] =
    _ -> _ -> Vector.empty()

pub def launch(_f: t1 -> t2 -> t3 -> t): Vector[String] -> Vector[String] -> Vector[String] \ IO with Order[t1] =
    _ -> _ -> Vector.empty()

pub def effectOnly(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): String -> String -> String -> String -> String -> String \ IO =
    _ -> _ -> _ -> _ -> _ -> ""

pub def noted(_f: t1 -> t2 -> t3 -> t): /* keep */ Vector[String] -> Vector[String] -> Vector[String] with Order[t1] =
    _ -> _ -> Vector.empty()

pub def edge(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t):
    Vector[String] -> Vector[String] -> Vector[String] -> Vxxxxxxxxxxxxxxxxxxxxx with Order[t1] =
    _ -> _ -> _ -> Vector.empty()

pub def edge0(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t):
    Vector[String] -> Vector[String] -> Vector[String] -> Vxxxxxxxxxxxxxxxxxxxxxx with Order[t1] =
    _ -> _ -> _ -> Vector.empty()

pub def edge5(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t):
    Vector[String] -> Vector[String] -> Vector[String] -> Vxxxxxxxxxxxxxxxx
    with Order[t1], Order[t10], Order[t11], Order[t12], Order[t13], Order[t14], Order[t15] =
    _ -> _ -> _ -> Vector.empty()

pub def edge2(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[String] -> Vector[String]
    with Order[t1], Order[t10], Order[t11], Order[t12], Order[t13], Order[t14] = _ -> Vector.empty()

pub def edge3(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): Vector[String] -> Vector[String]
    with Order[t1], Order[t10], Order[t11], Order[t12], Order[t13], Order[t145] = _ -> Vector.empty()

mod Outer {
    pub def edge(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t):
        Vector[String] -> Vector[String] -> Vector[String] -> Vxxxxxxxxxxxxxxxxxxxxx with Order[t1] =
        _ -> _ -> _ -> Vector.empty()

    mod Inner {
        pub def lift5(_f: t1 -> t2 -> t3 -> t4 -> t5 -> t): String -> String -> String -> String -> String -> String
            with Order[t1], Order[t2], Order[t3], Order[t4], Order[t5], Order[t] = _ -> _ -> _ -> _ -> _ -> ""
    }
}
```
