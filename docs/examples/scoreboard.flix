def score(points:List[Int32]):Int32=
List.foldLeft((sum,next) -> sum+next,0,points)

pub def scoreboard():String={
let home=List#{3,5,2};
let away=List#{2,4,3};
let totals=par (left <- score(home);right <- score(away)) yield (left,right);
match totals{
case (a,b) if a>b =>"Home wins ${a}–${b}"
case (a,b) if a<b =>"Away wins ${b}–${a}"
case (a,_) =>"Draw at ${a}"
}
}
