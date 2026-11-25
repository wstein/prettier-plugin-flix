---
title: "Align across adjacent row comments"
description: "An adjacent line comment keeps the row's alignment. A blank line on either side separates groups."
---

## Input

```flix
def area(plan:FloorPlan):Int32=match plan{
case FloorPlan.Square(side)=>side*side
// comment
case FloorPlan.Rectangle(width,height)=>width*height
}

def grouped(n:Int32):Int32=match n{
case 1=>1


// new group
case 200=>2
// standalone heading


case 3000=>3
// travels with the next arm
case 4=>4
}

def block(n:Int32):Int32=match n{
case 1=>1
/* Block comment marks a new group. */
case 1000=>2
}

def record()={
x=1,
// comment
longField=2
}

def map()=Map#{
"A"=>1,
// comment
"Long key"=>2
}

def noop()=handler Canvas{
def clear(c,k)=k()
// comment
def dimensions(k)=k((80,24))
}

def shifted()=Map#{
"A"=>1 // before comma
, // after comma
"Long key"=>2
}

def split()=handler Canvas{
def clear(c,k)=k()


// row comment
def dimensions(k)=k((80,24))
}

def trail(): Map[String, Int32] = Map#{
"A"=>1, /* after the comma */
"Long key"=>2
}

def moved(): Map[String, Int32] = Map#{
"A"=>1 // before the comma
, /* after the comma */
"Long key"=>2
}
```

## Output

```flix
def area(plan: FloorPlan): Int32 = match plan {
    case FloorPlan.Square(side)             => side * side
    // comment
    case FloorPlan.Rectangle(width, height) => width * height
}

def grouped(n: Int32): Int32 = match n {
    case 1 => 1

    // new group
    case 200 => 2
    // standalone heading

    case 3000 => 3
    // travels with the next arm
    case 4    => 4
}

def block(n: Int32): Int32 = match n {
    case 1 => 1
    /* Block comment marks a new group. */
    case 1000 => 2
}

def record() = {
    x         = 1,
    // comment
    longField = 2
}

def map() = Map#{
    "A"        => 1,
    // comment
    "Long key" => 2
}

def noop() = handler Canvas {
    def clear(c, k)   = k()
    // comment
    def dimensions(k) = k((80, 24))
}

def shifted() = Map#{
    "A"        => 1,  // before comma
    // after comma
    "Long key" => 2
}

def split() = handler Canvas {
    def clear(c, k) = k()

    // row comment
    def dimensions(k) = k((80, 24))
}

def trail(): Map[String, Int32] = Map#{
    "A"        => 1, /* after the comma */
    "Long key" => 2
}

def moved(): Map[String, Int32] = Map#{
    "A" => 1,  // before the comma
    /* after the comma */
    "Long key" => 2
}
```

```flix printWidth=54
def area(plan: FloorPlan): Int32 = match plan {
    case FloorPlan.Square(side) => side * side
    // comment
    case FloorPlan.Rectangle(width, height) =>
        width * height
}

def grouped(n: Int32): Int32 = match n {
    case 1 => 1

    // new group
    case 200 => 2
    // standalone heading

    case 3000 => 3
    // travels with the next arm
    case 4    => 4
}

def block(n: Int32): Int32 = match n {
    case 1 => 1
    /* Block comment marks a new group. */
    case 1000 => 2
}

def record() = {
    x         = 1,
    // comment
    longField = 2
}

def map() = Map#{
    "A"        => 1,
    // comment
    "Long key" => 2
}

def noop() = handler Canvas {
    def clear(c, k)   = k()
    // comment
    def dimensions(k) = k((80, 24))
}

def shifted() = Map#{
    "A"        => 1,  // before comma
    // after comma
    "Long key" => 2
}

def split() = handler Canvas {
    def clear(c, k) = k()

    // row comment
    def dimensions(k) = k((80, 24))
}

def trail(): Map[String, Int32] = Map#{
    "A"        => 1, /* after the comma */
    "Long key" => 2
}

def moved(): Map[String, Int32] = Map#{
    "A" => 1,  // before the comma
    /* after the comma */
    "Long key" => 2
}
```
