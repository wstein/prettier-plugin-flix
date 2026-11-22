---
title: Wrap at signature boundaries
description: "Keep a short return type, record or effect set together when a clause can move to a continuation line."
flix: "0.80"
---

## Input

```flix
eff Console {
    def confirm(p: a, default: {default = Bool}): Bool \ Console with ToString[a]
}
def wait(rx: Receiver[Int32], n: Int32, tx: Sender[List[Int32]]): Unit \ { Chan, NonDet } =
    Channel.send(recvN(n, rx), tx)
pub def lookup(m: Map[a, b], k: a): Option[b] with Order[a], ToString[b], Eq[b], Hash[a] = Map.get(k, m)
pub def lift0X1(f: Vector[(o1)]): Vector[Boxed] -> Vector[Vector[Boxed]] with Order[o1] =
    (_: Vector[Boxed]) ->
        let g = match (o1) -> Vector#{box(o1)};
        Vector.map(g, f)
```

## Output

```flix
eff Console {
    def confirm(p: a, default: { default = Bool }): Bool \ Console
        with ToString[a]
}
def wait(rx: Receiver[Int32], n: Int32, tx: Sender[List[Int32]]): Unit
    \ { Chan, NonDet } = Channel.send(recvN(n, rx), tx)
pub def lookup(m: Map[a, b], k: a): Option[b]
    with Order[a], ToString[b], Eq[b], Hash[a] = Map.get(k, m)
pub def lift0X1(f: Vector[(o1)]): Vector[Boxed] -> Vector[Vector[Boxed]]
    with Order[o1] =
        (_: Vector[Boxed]) ->
            let g = match (o1) -> Vector#{box(o1)};
            Vector.map(g, f)
```

```flix printWidth=50
eff Console {
    def confirm(p: a, default: {
        default = Bool
    }): Bool \ Console with ToString[a]
}
def wait(
    rx: Receiver[Int32],
    n: Int32,
    tx: Sender[List[Int32]]
): Unit \ { Chan, NonDet } =
    Channel.send(recvN(n, rx), tx)
pub def lookup(m: Map[a, b], k: a): Option[b]
    with Order[a], ToString[b], Eq[b], Hash[a] =
        Map.get(k, m)
pub def lift0X1(f: Vector[(o1)]): Vector[Boxed] ->
        Vector[Vector[Boxed]] with Order[o1] =
    (_: Vector[Boxed]) ->
        let g = match (o1) -> Vector#{box(o1)};
        Vector.map(g, f)
```

```flix printWidth=60
eff Console {
    def confirm(p: a, default: { default = Bool }): Bool
        \ Console with ToString[a]
}
def wait(
    rx: Receiver[Int32],
    n: Int32,
    tx: Sender[List[Int32]]
): Unit \ { Chan, NonDet } = Channel.send(recvN(n, rx), tx)
pub def lookup(m: Map[a, b], k: a): Option[b]
    with Order[a], ToString[b], Eq[b], Hash[a] =
        Map.get(k, m)
pub def lift0X1(f: Vector[(o1)]):
    Vector[Boxed] -> Vector[Vector[Boxed]] with Order[o1] =
    (_: Vector[Boxed]) ->
        let g = match (o1) -> Vector#{box(o1)};
        Vector.map(g, f)
```

```flix printWidth=70
eff Console {
    def confirm(p: a, default: { default = Bool }): Bool \ Console
        with ToString[a]
}
def wait(rx: Receiver[Int32], n: Int32, tx: Sender[List[Int32]]): Unit
    \ { Chan, NonDet } = Channel.send(recvN(n, rx), tx)
pub def lookup(m: Map[a, b], k: a): Option[b]
    with Order[a], ToString[b], Eq[b], Hash[a] = Map.get(k, m)
pub def lift0X1(f: Vector[(o1)]):
    Vector[Boxed] -> Vector[Vector[Boxed]] with Order[o1] =
    (_: Vector[Boxed]) ->
        let g = match (o1) -> Vector#{box(o1)};
        Vector.map(g, f)
```
