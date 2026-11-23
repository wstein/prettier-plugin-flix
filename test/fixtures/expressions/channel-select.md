---
title: "Select a message from a spawned task"
group: "Additional language constructs"
source: "https://github.com/flix/flix/blob/v0.80.0/main/test/flix/Test.Exp.Concurrency.Select.flix#L5"
---

## Input

```flix
@Test
def testSelectBuffered01(): Unit \ (Assert + Chan + NonDet) = region rc {
    let (tx1, rx1) = Channel.buffered(1);
    spawn Channel.send(1, tx1) @ rc;
    let r = select {
        case x <- recv(rx1) => x
    };
    assertEq(expected = 1, r)
}
```

## Output

```flix
@Test
def testSelectBuffered01(): Unit \ (Assert + Chan + NonDet) = region rc {
    let (tx1, rx1) = Channel.buffered(1);
    spawn Channel.send(1, tx1) @ rc;
    let r = select {
        case x <- recv(rx1) => x
    };
    assertEq(expected = 1, r)
}
```
