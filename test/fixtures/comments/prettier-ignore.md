---
title: prettier-ignore keeps the next declaration as written
description: "An own-line directive preserves the next declaration, including its interior and suffix comments."
group: "Line endings and comment placement"
---

## Input

```flix
// prettier-ignore
def   keep(x:Int32):Int32=x+1

def  format(x:Int32):Int32=x+1 // prettier-ignore

def  stillFormats():Int32=42

mod Example{
    // prettier-ignore
    pub def   keepNested():Vector[(String,Int32)]=Vector#{
      ("🚉", 8), // first
      ("Library", 126) // second
    } // preserved suffix

    pub def  tidy(x:Int32):Int32={
        let q=x+1; // first calculation
        let total=q+1; // second calculation
        total
    }
}
```

## Output

```flix
// prettier-ignore
def   keep(x:Int32):Int32=x+1

def format(x: Int32): Int32 = x + 1  // prettier-ignore

def stillFormats(): Int32 = 42

mod Example {
    // prettier-ignore
    pub def   keepNested():Vector[(String,Int32)]=Vector#{
      ("🚉", 8), // first
      ("Library", 126) // second
    } // preserved suffix

    pub def tidy(x: Int32): Int32 = {
        let q = x + 1;      // first calculation
        let total = q + 1;  // second calculation
        total
    }
}
```
