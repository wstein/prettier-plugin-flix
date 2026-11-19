---
title: "Map arrows with and without an inline comment"
description: "The same retry limits align in both maps. Line comments stay beside their entries and keep their usual spacing."
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
"export"=>1, // Exports are expensive to retry.
"batch"      =>2,
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
    "export" => 1, // Exports are expensive to retry.
    "batch"  => 2,
    "sync"   => 120 // Sync attempts are cheap.
}
```
