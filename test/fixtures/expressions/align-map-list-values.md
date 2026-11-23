---
title: "Align map arrows next to list literals"
description: "The header map aligns its arrows when the lists fit on one line. A narrow width wraps the list values and uses one space around each arrow."
---

## Input

```flix
pub def defaultHeaders(): Map[String, List[String]] =
    let headers = Map#{
        "Accept" => List#{"application/json"},
        "Authorization" => List#{"Bearer tok123"}
    };
    headers
```

## Output

```flix
pub def defaultHeaders(): Map[String, List[String]] =
    let headers = Map#{
        "Accept"        => List#{"application/json"},
        "Authorization" => List#{"Bearer tok123"}
    };
    headers
```

```flix printWidth=44
pub def defaultHeaders():
    Map[String, List[String]] =
    let headers = Map#{
        "Accept" => List#{
            "application/json"
        },
        "Authorization" => List#{
            "Bearer tok123"
        }
    };
    headers
```
