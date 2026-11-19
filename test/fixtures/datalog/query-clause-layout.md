---
title: Wrap Datalog queries at clause boundaries
description: "The return schema hangs from the signature when both rows fit. The query wraps before select and, at narrower widths, before from."
flix: "0.80"
source: "https://github.com/flix/book/blob/64d81bd6984ede06442ef7b63235092b9fe3c29c/src/fixpoints.md#L89"
---

## Input

```flix
def getParents(): #{ ParentOf(String, String) | r } = #{ParentOf("A", "B"). ParentOf("B", "C"). }
def getAdoptions(): #{ AdoptedBy(String, String) | r } = #{AdoptedBy("C", "D"). }
def withAncestors(): #{ ParentOf(String, String), AncestorOf(String, String) | r } = #{ AncestorOf(x, y) :- ParentOf(x, y). AncestorOf(x, z) :- AncestorOf(x, y), AncestorOf(y, z). }
def paths(): Vector[(String, String)] =
    query getParents(), getAdoptions(), withAncestors() select (x, y) from AncestorOf(x, y)

def directPaths(): Vector[(String, String)] =
    query getParents() select (parentStation, childStation) from ParentOf(parentStation, childStation)
```

## Output

```flix
def getParents(): #{ ParentOf(String, String) | r } = #{
    ParentOf("A", "B").
    ParentOf("B", "C").
}
def getAdoptions(): #{ AdoptedBy(String, String) | r } = #{
    AdoptedBy("C", "D").
}
def withAncestors(): #{ ParentOf(String, String),
                        AncestorOf(String, String) | r } = #{
    AncestorOf(x, y) :- ParentOf(x, y).
    AncestorOf(x, z) :- AncestorOf(x, y), AncestorOf(y, z).
}
def paths(): Vector[(String, String)] =
    query getParents(), getAdoptions(), withAncestors()
        select (x, y) from AncestorOf(x, y)

def directPaths(): Vector[(String, String)] =
    query getParents()
        select (parentStation, childStation)
        from ParentOf(parentStation, childStation)
```

```flix printWidth=60
def getParents(): #{ ParentOf(String, String) | r } = #{
    ParentOf("A", "B").
    ParentOf("B", "C").
}
def getAdoptions(): #{ AdoptedBy(String, String) | r } = #{
    AdoptedBy("C", "D").
}
def withAncestors(): #{
    ParentOf(String, String),
    AncestorOf(String, String) | r
} = #{
    AncestorOf(x, y) :- ParentOf(x, y).
    AncestorOf(x, z) :- AncestorOf(x, y), AncestorOf(y, z).
}
def paths(): Vector[(String, String)] =
    query getParents(), getAdoptions(), withAncestors()
        select (x, y) from AncestorOf(x, y)

def directPaths(): Vector[(String, String)] =
    query getParents()
        select (parentStation, childStation)
        from ParentOf(parentStation, childStation)
```

```flix printWidth=120
def getParents(): #{ ParentOf(String, String) | r } = #{ ParentOf("A", "B"). ParentOf("B", "C"). }
def getAdoptions(): #{ AdoptedBy(String, String) | r } = #{ AdoptedBy("C", "D"). }
def withAncestors(): #{ ParentOf(String, String), AncestorOf(String, String) | r } = #{
    AncestorOf(x, y) :- ParentOf(x, y).
    AncestorOf(x, z) :- AncestorOf(x, y), AncestorOf(y, z).
}
def paths(): Vector[(String, String)] =
    query getParents(), getAdoptions(), withAncestors() select (x, y) from AncestorOf(x, y)

def directPaths(): Vector[(String, String)] =
    query getParents() select (parentStation, childStation) from ParentOf(parentStation, childStation)
```
