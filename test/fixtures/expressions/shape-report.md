---
title: "Room area and labels"
description: "Format match arms, a record update, and a room description."
group: "Playground examples"
flix: "0.80"
---

## Input

```flix
enum FloorPlan{
case Square(Int32),
case Rectangle(Int32,Int32)
}

def area(plan:FloorPlan):Int32=match plan{
case FloorPlan.Square(side)=>side*side
case FloorPlan.Rectangle(width,height)=>width*height
}

// Keep extra fields when a room gets a public name.
def renameRoom(room:{name=String,plan=FloorPlan|r},label:String):{name=String,plan=FloorPlan|r}=
{name=label|room}

def describe(room:{name=String,plan=FloorPlan|r}):String={
let size=area(room#plan);
let kind=if(size>=40) "large" else "small";
"${room#name} is a ${kind} room with ${size} square metres"
}

pub def roomReport():String={
let room={name="Workshop",plan=FloorPlan.Rectangle(6,8),floor=2};
describe(renameRoom(room,"Design studio"))
}
```

## Output

```flix
enum FloorPlan {
    case Square(Int32),
    case Rectangle(Int32, Int32)
}

def area(plan: FloorPlan): Int32 = match plan {
    case FloorPlan.Square(side)             => side * side
    case FloorPlan.Rectangle(width, height) => width * height
}

// Keep extra fields when a room gets a public name.
def renameRoom(room: { name = String, plan = FloorPlan | r }, label: String): {
    name = String,
    plan = FloorPlan | r
} = { name = label | room }

def describe(room: { name = String, plan = FloorPlan | r }): String = {
    let size = area(room#plan);
    let kind = if (size >= 40) "large" else "small";
    "${room#name} is a ${kind} room with ${size} square metres"
}

pub def roomReport(): String = {
    let room = {
        name = "Workshop",
        plan = FloorPlan.Rectangle(6, 8),
        floor = 2
    };
    describe(renameRoom(room, "Design studio"))
}
```
