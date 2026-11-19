---
title: "Wrap a dense release summary"
description: "The input packs an entire definition onto one line. With printWidth set to 80, the formatter wraps the signature, bindings, and final expression."
flix: "0.80"
showcase: 2
options: { printWidth: 80 }
---

## Input

```flix
pub def releaseSummary(projectName: String,version: String,platform: String,maintainer: String,artifact: String,checksum: String,documentation: String): String = {let header = "Release ${projectName} ${version}"; let location = "Platform ${platform} has artifact ${artifact}"; let verification = "Verify the download with SHA-256 ${checksum}"; let support = "Contact ${maintainer} for release support"; let guide = "Read the installation guide at ${documentation}"; header + "\n" + location + "\n" + verification + "\n" + support + "\n" + guide}
```

## Output

```flix
pub def releaseSummary(
    projectName: String,
    version: String,
    platform: String,
    maintainer: String,
    artifact: String,
    checksum: String,
    documentation: String
): String = {
    let header = "Release ${projectName} ${version}";
    let location = "Platform ${platform} has artifact ${artifact}";
    let verification = "Verify the download with SHA-256 ${checksum}";
    let support = "Contact ${maintainer} for release support";
    let guide = "Read the installation guide at ${documentation}";
    header + "\n" +
        location + "\n" +
        verification + "\n" +
        support + "\n" +
        guide
}
```
