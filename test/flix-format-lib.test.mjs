import test from "node:test";
import assert from "node:assert/strict";
import { summarizeDiagnostics } from "../scripts/flix-format-lib.mjs";

// Layouts as printed by flix 0.80.0 (E7796 with a `>>` line, E6217 with an excerpt and no `>>`).
const typeMismatch = `-- Type Error [E7796] --------------------------------------------------- A.flix

>> Unexpected type: expected 'Int32', found 'String'.

2 | def g(): Int32 = "x"
    ^^^^^^^^^^^^^^^^^^^^
    unexpected type

`;
const unusedEffect = `-- Type Error [E6217] --------------------------------------------------- A.flix

1 | def f(): Int32 \\ IO = 1
                     ^^
                     Unused effect: 'IO'

Explanation: To fix this, either remove 'IO' from the signature
or use the effect in the function body

`;
const trailer = "Compilation failed with 2 error(s).\n";

test("summarizes a block with a >> line", () => {
    assert.equal(summarizeDiagnostics(typeMismatch + trailer), "Type Error [E7796]: Unexpected type: expected 'Int32', found 'String'.\n");
});

test("summarizes a block without a >> line by its first message line", () => {
    assert.equal(summarizeDiagnostics(unusedEffect), "Type Error [E6217]: Unused effect: 'IO'\n");
});

test("keeps every diagnostic of mixed output in order", () => {
    assert.equal(
        summarizeDiagnostics(unusedEffect + typeMismatch + trailer),
        "Type Error [E6217]: Unused effect: 'IO'\nType Error [E7796]: Unexpected type: expected 'Int32', found 'String'.\n",
    );
    assert.equal(summarizeDiagnostics(typeMismatch + unusedEffect).split("\n").length, 3);
});

test("ignores colors and CRLF", () => {
    const colored = (unusedEffect + typeMismatch).replace(/\n/g, "\r\n").replace("Unused", "\x1b[35mUnused\x1b[0m");
    assert.equal(summarizeDiagnostics(colored).split("\n").length, 3);
});

test("a block with only an excerpt is summarized by its header", () => {
    assert.equal(summarizeDiagnostics("-- Type Error [E7807] ---- A.flix\n\n1 | x\n    ^\n"), "Type Error [E7807]\n");
});

test("output without a header is rejected", () => {
    assert.throws(() => summarizeDiagnostics("something unexpected\n", "x.md"), /Unrecognized Flix diagnostics for x\.md/);
});
