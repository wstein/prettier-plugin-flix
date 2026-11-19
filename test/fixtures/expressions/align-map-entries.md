---
title: "Align arrows in multiline maps"
description: "The keys have different display widths, including a two-column emoji. An inline map stays compact and a narrow width can omit the padding."
flix: "0.80"
showcase: 6
---

## Input

```flix
pub def labels(): Map[String, Int32] = Map#{
"🚲"=>1,
"train"=>22
}

pub def counts(): Map[Int32, Int32] = Map#{1=>2,200=>3,4000=>4}
```

## Output

```flix
pub def labels(): Map[String, Int32] = Map#{
    "🚲"    => 1,
    "train" => 22
}

pub def counts(): Map[Int32, Int32] = Map#{1 => 2, 200 => 3, 4000 => 4}
```

```flix printWidth=18
pub def labels(): Map[
    String,
    Int32
] = Map#{
    "🚲" => 1,
    "train" => 22
}

pub def counts(): Map[
    Int32,
    Int32
] = Map#{
    1    => 2,
    200  => 3,
    4000 => 4
}
```
