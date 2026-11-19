enum FloorPlan{
case Square(Int32),case Rectangle(Int32,Int32)
}

def area(plan:FloorPlan):Int32=match plan{
case FloorPlan.Square(side)=>side*side
case FloorPlan.Rectangle(width,height)=>width*height
}

pub def roomReport():String={
let room={name="Workshop",plan=FloorPlan.Rectangle(6,8)};
let size=area(room#plan);
let kind=if(size>=40) "large" else "small";
"${room#name} is a ${kind} room with ${size} square metres"
}
