---
title: "Map arrows with and without an inline comment"
description: "Both maps contain the same retry limits. The first aligns its arrows. The second uses one space around each arrow and keeps the retry note beside the export entry."
flix: "0.80"
---

## Input

```flix
pub def retryLimits(): Map[String, Int32] = Map#{
"export"=>1,
"batch"      =>2,
"sync"=>3
}

pub def documentedRetryLimits(): Map[String, Int32] = Map#{
"export"=>1, // Exports are expensive to retry.
"batch"      =>2,
"sync"=>3
}
```

## Output

```flix
pub def retryLimits(): Map[String, Int32] = Map#{
    "export" => 1,
    "batch"  => 2,
    "sync"   => 3
}

pub def documentedRetryLimits(): Map[String, Int32] = Map#{
    "export" => 1, // Exports are expensive to retry.
    "batch" => 2,
    "sync" => 3
}
```
