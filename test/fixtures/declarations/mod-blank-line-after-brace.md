---
title: "Blank line after the opening brace of a declaration block"
description: "Keep a source blank after `{` of a mod, trait, instance or enum. When the body has at least 50 members and has no blank, insert one. Never delete an existing blank; short blocks without a blank stay tight."
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
mod MidTight {
    def n00(): Int32 = 0
    def n01(): Int32 = 1
    def n02(): Int32 = 2
    def n03(): Int32 = 3
    def n04(): Int32 = 4
    def n05(): Int32 = 5
    def n06(): Int32 = 6
    def n07(): Int32 = 7
    def n08(): Int32 = 8
    def n09(): Int32 = 9
    def n10(): Int32 = 10
    def n11(): Int32 = 11
    def n12(): Int32 = 12
    def n13(): Int32 = 13
    def n14(): Int32 = 14
    def n15(): Int32 = 15
    def n16(): Int32 = 16
    def n17(): Int32 = 17
    def n18(): Int32 = 18
    def n19(): Int32 = 19
    def n20(): Int32 = 20
    def n21(): Int32 = 21
    def n22(): Int32 = 22
    def n23(): Int32 = 23
    def n24(): Int32 = 24
    def n25(): Int32 = 25
    def n26(): Int32 = 26
    def n27(): Int32 = 27
    def n28(): Int32 = 28
    def n29(): Int32 = 29
    def n30(): Int32 = 30
    def n31(): Int32 = 31
    def n32(): Int32 = 32
    def n33(): Int32 = 33
    def n34(): Int32 = 34
    def n35(): Int32 = 35
    def n36(): Int32 = 36
    def n37(): Int32 = 37
    def n38(): Int32 = 38
    def n39(): Int32 = 39
    def n40(): Int32 = 40
    def n41(): Int32 = 41
    def n42(): Int32 = 42
    def n43(): Int32 = 43
    def n44(): Int32 = 44
    def n45(): Int32 = 45
    def n46(): Int32 = 46
    def n47(): Int32 = 47
    def n48(): Int32 = 48
}
mod LongTight {
    def n00(): Int32 = 0
    def n01(): Int32 = 1
    def n02(): Int32 = 2
    def n03(): Int32 = 3
    def n04(): Int32 = 4
    def n05(): Int32 = 5
    def n06(): Int32 = 6
    def n07(): Int32 = 7
    def n08(): Int32 = 8
    def n09(): Int32 = 9
    def n10(): Int32 = 10
    def n11(): Int32 = 11
    def n12(): Int32 = 12
    def n13(): Int32 = 13
    def n14(): Int32 = 14
    def n15(): Int32 = 15
    def n16(): Int32 = 16
    def n17(): Int32 = 17
    def n18(): Int32 = 18
    def n19(): Int32 = 19
    def n20(): Int32 = 20
    def n21(): Int32 = 21
    def n22(): Int32 = 22
    def n23(): Int32 = 23
    def n24(): Int32 = 24
    def n25(): Int32 = 25
    def n26(): Int32 = 26
    def n27(): Int32 = 27
    def n28(): Int32 = 28
    def n29(): Int32 = 29
    def n30(): Int32 = 30
    def n31(): Int32 = 31
    def n32(): Int32 = 32
    def n33(): Int32 = 33
    def n34(): Int32 = 34
    def n35(): Int32 = 35
    def n36(): Int32 = 36
    def n37(): Int32 = 37
    def n38(): Int32 = 38
    def n39(): Int32 = 39
    def n40(): Int32 = 40
    def n41(): Int32 = 41
    def n42(): Int32 = 42
    def n43(): Int32 = 43
    def n44(): Int32 = 44
    def n45(): Int32 = 45
    def n46(): Int32 = 46
    def n47(): Int32 = 47
    def n48(): Int32 = 48
    def n49(): Int32 = 49
}
mod LongOpen {

    def n00(): Int32 = 0
    def n01(): Int32 = 1
    def n02(): Int32 = 2
    def n03(): Int32 = 3
    def n04(): Int32 = 4
    def n05(): Int32 = 5
    def n06(): Int32 = 6
    def n07(): Int32 = 7
    def n08(): Int32 = 8
    def n09(): Int32 = 9
    def n10(): Int32 = 10
    def n11(): Int32 = 11
    def n12(): Int32 = 12
    def n13(): Int32 = 13
    def n14(): Int32 = 14
    def n15(): Int32 = 15
    def n16(): Int32 = 16
    def n17(): Int32 = 17
    def n18(): Int32 = 18
    def n19(): Int32 = 19
    def n20(): Int32 = 20
    def n21(): Int32 = 21
    def n22(): Int32 = 22
    def n23(): Int32 = 23
    def n24(): Int32 = 24
    def n25(): Int32 = 25
    def n26(): Int32 = 26
    def n27(): Int32 = 27
    def n28(): Int32 = 28
    def n29(): Int32 = 29
    def n30(): Int32 = 30
    def n31(): Int32 = 31
    def n32(): Int32 = 32
    def n33(): Int32 = 33
    def n34(): Int32 = 34
    def n35(): Int32 = 35
    def n36(): Int32 = 36
    def n37(): Int32 = 37
    def n38(): Int32 = 38
    def n39(): Int32 = 39
    def n40(): Int32 = 40
    def n41(): Int32 = 41
    def n42(): Int32 = 42
    def n43(): Int32 = 43
    def n44(): Int32 = 44
    def n45(): Int32 = 45
    def n46(): Int32 = 46
    def n47(): Int32 = 47
    def n48(): Int32 = 48
    def n49(): Int32 = 49
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
mod MidTight {
    def n00(): Int32 = 0
    def n01(): Int32 = 1
    def n02(): Int32 = 2
    def n03(): Int32 = 3
    def n04(): Int32 = 4
    def n05(): Int32 = 5
    def n06(): Int32 = 6
    def n07(): Int32 = 7
    def n08(): Int32 = 8
    def n09(): Int32 = 9
    def n10(): Int32 = 10
    def n11(): Int32 = 11
    def n12(): Int32 = 12
    def n13(): Int32 = 13
    def n14(): Int32 = 14
    def n15(): Int32 = 15
    def n16(): Int32 = 16
    def n17(): Int32 = 17
    def n18(): Int32 = 18
    def n19(): Int32 = 19
    def n20(): Int32 = 20
    def n21(): Int32 = 21
    def n22(): Int32 = 22
    def n23(): Int32 = 23
    def n24(): Int32 = 24
    def n25(): Int32 = 25
    def n26(): Int32 = 26
    def n27(): Int32 = 27
    def n28(): Int32 = 28
    def n29(): Int32 = 29
    def n30(): Int32 = 30
    def n31(): Int32 = 31
    def n32(): Int32 = 32
    def n33(): Int32 = 33
    def n34(): Int32 = 34
    def n35(): Int32 = 35
    def n36(): Int32 = 36
    def n37(): Int32 = 37
    def n38(): Int32 = 38
    def n39(): Int32 = 39
    def n40(): Int32 = 40
    def n41(): Int32 = 41
    def n42(): Int32 = 42
    def n43(): Int32 = 43
    def n44(): Int32 = 44
    def n45(): Int32 = 45
    def n46(): Int32 = 46
    def n47(): Int32 = 47
    def n48(): Int32 = 48
}
mod LongTight {

    def n00(): Int32 = 0
    def n01(): Int32 = 1
    def n02(): Int32 = 2
    def n03(): Int32 = 3
    def n04(): Int32 = 4
    def n05(): Int32 = 5
    def n06(): Int32 = 6
    def n07(): Int32 = 7
    def n08(): Int32 = 8
    def n09(): Int32 = 9
    def n10(): Int32 = 10
    def n11(): Int32 = 11
    def n12(): Int32 = 12
    def n13(): Int32 = 13
    def n14(): Int32 = 14
    def n15(): Int32 = 15
    def n16(): Int32 = 16
    def n17(): Int32 = 17
    def n18(): Int32 = 18
    def n19(): Int32 = 19
    def n20(): Int32 = 20
    def n21(): Int32 = 21
    def n22(): Int32 = 22
    def n23(): Int32 = 23
    def n24(): Int32 = 24
    def n25(): Int32 = 25
    def n26(): Int32 = 26
    def n27(): Int32 = 27
    def n28(): Int32 = 28
    def n29(): Int32 = 29
    def n30(): Int32 = 30
    def n31(): Int32 = 31
    def n32(): Int32 = 32
    def n33(): Int32 = 33
    def n34(): Int32 = 34
    def n35(): Int32 = 35
    def n36(): Int32 = 36
    def n37(): Int32 = 37
    def n38(): Int32 = 38
    def n39(): Int32 = 39
    def n40(): Int32 = 40
    def n41(): Int32 = 41
    def n42(): Int32 = 42
    def n43(): Int32 = 43
    def n44(): Int32 = 44
    def n45(): Int32 = 45
    def n46(): Int32 = 46
    def n47(): Int32 = 47
    def n48(): Int32 = 48
    def n49(): Int32 = 49
}
mod LongOpen {

    def n00(): Int32 = 0
    def n01(): Int32 = 1
    def n02(): Int32 = 2
    def n03(): Int32 = 3
    def n04(): Int32 = 4
    def n05(): Int32 = 5
    def n06(): Int32 = 6
    def n07(): Int32 = 7
    def n08(): Int32 = 8
    def n09(): Int32 = 9
    def n10(): Int32 = 10
    def n11(): Int32 = 11
    def n12(): Int32 = 12
    def n13(): Int32 = 13
    def n14(): Int32 = 14
    def n15(): Int32 = 15
    def n16(): Int32 = 16
    def n17(): Int32 = 17
    def n18(): Int32 = 18
    def n19(): Int32 = 19
    def n20(): Int32 = 20
    def n21(): Int32 = 21
    def n22(): Int32 = 22
    def n23(): Int32 = 23
    def n24(): Int32 = 24
    def n25(): Int32 = 25
    def n26(): Int32 = 26
    def n27(): Int32 = 27
    def n28(): Int32 = 28
    def n29(): Int32 = 29
    def n30(): Int32 = 30
    def n31(): Int32 = 31
    def n32(): Int32 = 32
    def n33(): Int32 = 33
    def n34(): Int32 = 34
    def n35(): Int32 = 35
    def n36(): Int32 = 36
    def n37(): Int32 = 37
    def n38(): Int32 = 38
    def n39(): Int32 = 39
    def n40(): Int32 = 40
    def n41(): Int32 = 41
    def n42(): Int32 = 42
    def n43(): Int32 = 43
    def n44(): Int32 = 44
    def n45(): Int32 = 45
    def n46(): Int32 = 46
    def n47(): Int32 = 47
    def n48(): Int32 = 48
    def n49(): Int32 = 49
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
mod MidTight {
    def n00(): Int32 = 0
    def n01(): Int32 = 1
    def n02(): Int32 = 2
    def n03(): Int32 = 3
    def n04(): Int32 = 4
    def n05(): Int32 = 5
    def n06(): Int32 = 6
    def n07(): Int32 = 7
    def n08(): Int32 = 8
    def n09(): Int32 = 9
    def n10(): Int32 = 10
    def n11(): Int32 = 11
    def n12(): Int32 = 12
    def n13(): Int32 = 13
    def n14(): Int32 = 14
    def n15(): Int32 = 15
    def n16(): Int32 = 16
    def n17(): Int32 = 17
    def n18(): Int32 = 18
    def n19(): Int32 = 19
    def n20(): Int32 = 20
    def n21(): Int32 = 21
    def n22(): Int32 = 22
    def n23(): Int32 = 23
    def n24(): Int32 = 24
    def n25(): Int32 = 25
    def n26(): Int32 = 26
    def n27(): Int32 = 27
    def n28(): Int32 = 28
    def n29(): Int32 = 29
    def n30(): Int32 = 30
    def n31(): Int32 = 31
    def n32(): Int32 = 32
    def n33(): Int32 = 33
    def n34(): Int32 = 34
    def n35(): Int32 = 35
    def n36(): Int32 = 36
    def n37(): Int32 = 37
    def n38(): Int32 = 38
    def n39(): Int32 = 39
    def n40(): Int32 = 40
    def n41(): Int32 = 41
    def n42(): Int32 = 42
    def n43(): Int32 = 43
    def n44(): Int32 = 44
    def n45(): Int32 = 45
    def n46(): Int32 = 46
    def n47(): Int32 = 47
    def n48(): Int32 = 48
}
mod LongTight {

    def n00(): Int32 = 0
    def n01(): Int32 = 1
    def n02(): Int32 = 2
    def n03(): Int32 = 3
    def n04(): Int32 = 4
    def n05(): Int32 = 5
    def n06(): Int32 = 6
    def n07(): Int32 = 7
    def n08(): Int32 = 8
    def n09(): Int32 = 9
    def n10(): Int32 = 10
    def n11(): Int32 = 11
    def n12(): Int32 = 12
    def n13(): Int32 = 13
    def n14(): Int32 = 14
    def n15(): Int32 = 15
    def n16(): Int32 = 16
    def n17(): Int32 = 17
    def n18(): Int32 = 18
    def n19(): Int32 = 19
    def n20(): Int32 = 20
    def n21(): Int32 = 21
    def n22(): Int32 = 22
    def n23(): Int32 = 23
    def n24(): Int32 = 24
    def n25(): Int32 = 25
    def n26(): Int32 = 26
    def n27(): Int32 = 27
    def n28(): Int32 = 28
    def n29(): Int32 = 29
    def n30(): Int32 = 30
    def n31(): Int32 = 31
    def n32(): Int32 = 32
    def n33(): Int32 = 33
    def n34(): Int32 = 34
    def n35(): Int32 = 35
    def n36(): Int32 = 36
    def n37(): Int32 = 37
    def n38(): Int32 = 38
    def n39(): Int32 = 39
    def n40(): Int32 = 40
    def n41(): Int32 = 41
    def n42(): Int32 = 42
    def n43(): Int32 = 43
    def n44(): Int32 = 44
    def n45(): Int32 = 45
    def n46(): Int32 = 46
    def n47(): Int32 = 47
    def n48(): Int32 = 48
    def n49(): Int32 = 49
}
mod LongOpen {

    def n00(): Int32 = 0
    def n01(): Int32 = 1
    def n02(): Int32 = 2
    def n03(): Int32 = 3
    def n04(): Int32 = 4
    def n05(): Int32 = 5
    def n06(): Int32 = 6
    def n07(): Int32 = 7
    def n08(): Int32 = 8
    def n09(): Int32 = 9
    def n10(): Int32 = 10
    def n11(): Int32 = 11
    def n12(): Int32 = 12
    def n13(): Int32 = 13
    def n14(): Int32 = 14
    def n15(): Int32 = 15
    def n16(): Int32 = 16
    def n17(): Int32 = 17
    def n18(): Int32 = 18
    def n19(): Int32 = 19
    def n20(): Int32 = 20
    def n21(): Int32 = 21
    def n22(): Int32 = 22
    def n23(): Int32 = 23
    def n24(): Int32 = 24
    def n25(): Int32 = 25
    def n26(): Int32 = 26
    def n27(): Int32 = 27
    def n28(): Int32 = 28
    def n29(): Int32 = 29
    def n30(): Int32 = 30
    def n31(): Int32 = 31
    def n32(): Int32 = 32
    def n33(): Int32 = 33
    def n34(): Int32 = 34
    def n35(): Int32 = 35
    def n36(): Int32 = 36
    def n37(): Int32 = 37
    def n38(): Int32 = 38
    def n39(): Int32 = 39
    def n40(): Int32 = 40
    def n41(): Int32 = 41
    def n42(): Int32 = 42
    def n43(): Int32 = 43
    def n44(): Int32 = 44
    def n45(): Int32 = 45
    def n46(): Int32 = 46
    def n47(): Int32 = 47
    def n48(): Int32 = 48
    def n49(): Int32 = 49
}
```
