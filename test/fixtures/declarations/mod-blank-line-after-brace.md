---
title: "Keep one blank line after the opening brace of a declaration block"
description: "A blank line after the brace of a mod, trait, instance or enum stays, as in the built-in Flix formatter; several blank lines become one, and none is added."
group: "Declarations"
flix: "0.80"
options: { printWidth: 80 }
---

## Input

```flix
mod Outer {

    def a(): Int32 = 1
    def b(): Int32 = 2
    mod Inner {

        def c(): Int32 = 3
    }
}
mod Tight {
    def d(): Int32 = 4
}
mod Comment {

    // first
    def e(): Int32 = 5
}
mod CommentFirst {
    // first

    def f(): Int32 = 6
}
mod Many {



    def h(): Int32 = 8

}
mod Docs {

    /// Doc.
    def i(): Int32 = 9
}
mod Empty {

}
trait Show2[a] {

    pub def show(x: a): String
}
trait Bare[a] {
    pub def bare(x: a): String
}
instance Show2[Int32] {

    pub def show(x: Int32): String = "x"
}
instance Bare[Int32] {
    pub def bare(x: Int32): String = "x"
}
enum Color {

    case Red, Green
}
enum Plain {
    case Blue
}
```

## Output

```flix
mod Outer {

    def a(): Int32 = 1
    def b(): Int32 = 2
    mod Inner {

        def c(): Int32 = 3
    }
}
mod Tight {
    def d(): Int32 = 4
}
mod Comment {

    // first
    def e(): Int32 = 5
}
mod CommentFirst {
    // first

    def f(): Int32 = 6
}
mod Many {

    def h(): Int32 = 8
}
mod Docs {

    /// Doc.
    def i(): Int32 = 9
}
mod Empty {}
trait Show2[a] {

    pub def show(x: a): String
}
trait Bare[a] {
    pub def bare(x: a): String
}
instance Show2[Int32] {

    pub def show(x: Int32): String = "x"
}
instance Bare[Int32] {
    pub def bare(x: Int32): String = "x"
}
enum Color {

    case Red, Green
}
enum Plain {
    case Blue
}
```

```flix printWidth=40
mod Outer {

    def a(): Int32 = 1
    def b(): Int32 = 2
    mod Inner {

        def c(): Int32 = 3
    }
}
mod Tight {
    def d(): Int32 = 4
}
mod Comment {

    // first
    def e(): Int32 = 5
}
mod CommentFirst {
    // first

    def f(): Int32 = 6
}
mod Many {

    def h(): Int32 = 8
}
mod Docs {

    /// Doc.
    def i(): Int32 = 9
}
mod Empty {}
trait Show2[a] {

    pub def show(x: a): String
}
trait Bare[a] {
    pub def bare(x: a): String
}
instance Show2[Int32] {

    pub def show(x: Int32): String = "x"
}
instance Bare[Int32] {
    pub def bare(x: Int32): String = "x"
}
enum Color {

    case Red, Green
}
enum Plain {
    case Blue
}
```
