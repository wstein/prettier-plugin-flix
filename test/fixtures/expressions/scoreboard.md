---
title: "Parallel scoreboard"
description: "Format parallel score calculations and guarded match arms."
group: "Playground examples"
flix: "0.80"
---

## Input

```flix
def score(points:List[Int32]):Int32=
List.foldLeft((sum,next) -> sum+next,0,points)

def winner(totals:(Int32,Int32)):String=match totals{
case (a,b) if a>b =>"Home wins ${a}–${b}"
case (a,b) if a<b =>"Away wins ${b}–${a}"
case (a,_) =>"Draw at ${a}"
}

pub def scoreboard(home:List[Int32],away:List[Int32]):String={
// Each team's score can be calculated independently.
let totals=par (
left <- score(home);
right <- score(away)
) yield (left,right);
winner(totals)
}

pub def finalScore():String=
scoreboard(List#{3,5,2},List#{2,4,3})

@Test
def testDraw():Unit \ Assert=
Assert.assertEq(expected="Draw at 5",scoreboard(List#{3,2},List#{1,4}))

@Test
def testHomeWins():Unit \ Assert=
Assert.assertEq(expected="Home wins 10–9",finalScore())
```

## Output

```flix
def score(points: List[Int32]): Int32 =
    List.foldLeft((sum, next) -> sum + next, 0, points)

def winner(totals: (Int32, Int32)): String = match totals {
    case (a, b) if a > b => "Home wins ${a}–${b}"
    case (a, b) if a < b => "Away wins ${b}–${a}"
    case (a, _)          => "Draw at ${a}"
}

pub def scoreboard(home: List[Int32], away: List[Int32]): String = {
    // Each team's score can be calculated independently.
    let totals =
        par (left <- score(home); right <- score(away)) yield (left, right);
    winner(totals)
}

pub def finalScore(): String = scoreboard(List#{3, 5, 2}, List#{2, 4, 3})

@Test
def testDraw(): Unit \ Assert =
    Assert.assertEq(
        expected = "Draw at 5",
        scoreboard(List#{3, 2}, List#{1, 4})
    )

@Test
def testHomeWins(): Unit \ Assert =
    Assert.assertEq(expected = "Home wins 10–9", finalScore())
```
