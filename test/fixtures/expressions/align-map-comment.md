---
title: "Map arrows with and without an inline comment"
description: "The arrows align in both maps. The comments share a column at the default width and stay beside their entries at a narrower width."
flix: "0.80"
---

## Input

```flix
pub def retryLimits(): Map[String, Int32] = Map#{
"export"=>1,
"batch"      =>2,
"sync"=>120
}

pub def documentedRetryLimits(): Map[String, Int32] = Map#{
"batch"      =>2,
"export"=>1, // Exports are expensive to retry.
"sync"=>120 // Sync attempts are cheap.
}
```

## Output

```flix
pub def retryLimits(): Map[String, Int32] = Map#{
    "export" => 1,
    "batch"  => 2,
    "sync"   => 120
}

pub def documentedRetryLimits(): Map[String, Int32] = Map#{
    "batch"  => 2,
    "export" => 1,  // Exports are expensive to retry.
    "sync"   => 120 // Sync attempts are cheap.
}
```

```flix printWidth=53
pub def retryLimits(): Map[String, Int32] = Map#{
    "export" => 1,
    "batch"  => 2,
    "sync"   => 120
}

pub def documentedRetryLimits(): Map[
    String,
    Int32
] = Map#{
    "batch"  => 2,
    "export" => 1, // Exports are expensive to retry.
    "sync"   => 120 // Sync attempts are cheap.
}
```
