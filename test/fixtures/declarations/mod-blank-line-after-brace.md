---
title: "Keep one blank line after the opening brace of a declaration block"
description: "Keep one source blank line after the opening brace of a mod, trait, instance, eff or struct. Remove the opening blank line in enums, including those that contain only comments."
group: "Declarations"
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
mod BlockComment {

    /* First member. */
    pub def member(): Int32 = 1
}
mod OnlyComment {


    // Keep the blank line above this comment.
}
mod TightComment {
    /* No blank line above this comment. */

    // Keep the separation between comments.
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
eff Signal {

    // Trigger the signal.
    def ping(): Unit
}
eff TightSignal {
    def ping(): Unit
}
struct Board[r] {


    x: Int32
}
struct TightBoard[r] {
    x: Int32
}
enum Color {

    case Red, Green
}
enum Plain {
    case Blue
}
enum Commented {

    /* First case. */
    case Ready
}
enum OnlyComment {

    // An empty enum.
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
mod BlockComment {

    /* First member. */
    pub def member(): Int32 = 1
}
mod OnlyComment {

    // Keep the blank line above this comment.
}
mod TightComment {
    /* No blank line above this comment. */

    // Keep the separation between comments.
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
eff Signal {

    // Trigger the signal.
    def ping(): Unit
}
eff TightSignal {
    def ping(): Unit
}
struct Board[r] {

    x: Int32
}
struct TightBoard[r] {
    x: Int32
}
enum Color {
    case Red, Green
}
enum Plain {
    case Blue
}
enum Commented {
    /* First case. */
    case Ready
}
enum OnlyComment {
    // An empty enum.
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
mod BlockComment {

    /* First member. */
    pub def member(): Int32 = 1
}
mod OnlyComment {

    // Keep the blank line above this comment.
}
mod TightComment {
    /* No blank line above this comment. */

    // Keep the separation between comments.
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
eff Signal {

    // Trigger the signal.
    def ping(): Unit
}
eff TightSignal {
    def ping(): Unit
}
struct Board[r] {

    x: Int32
}
struct TightBoard[r] {
    x: Int32
}
enum Color {
    case Red, Green
}
enum Plain {
    case Blue
}
enum Commented {
    /* First case. */
    case Ready
}
enum OnlyComment {
    // An empty enum.
}
```
