import test from "node:test";
import assert from "node:assert/strict";
import { assess, summarizeDiagnostics, timeoutMs, unifiedDiff } from "../scripts/flix-format-lib.mjs";

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

const entry = (over = {}) => ({
    file: "a/b.md",
    status: "pass",
    outputs: [{ code: "x\n" }],
    invalid: false,
    saved: { language: "flix", code: "x\n" },
    actual: { language: "flix", code: "x\n", outputDiagnostics: "" },
    ...over,
});
const texts = (result) => result.lines.map((line) => line.text).join("\n");

test("an unchanged reference passes quietly", () => {
    const result = assess([entry()]);
    assert.equal(result.exitCode, 0);
    assert.deepEqual(result.writes, []);
    assert.equal(texts(result), "a/b.md: matches a Prettier snapshot");
});

test("a changed reference fails in check mode with a diff and is written by --update", () => {
    const changed = entry({ actual: { language: "flix", code: "y\n", outputDiagnostics: "" } });
    const check = assess([changed]);
    assert.equal(check.exitCode, 1);
    assert.deepEqual(check.writes, []);
    assert.match(texts(check), /a\/b\.md: reference changed\n@@ -1,1 \+1,1 @@\n-x\n\+y/);
    const update = assess([changed], { update: true });
    assert.equal(update.exitCode, 0);
    assert.deepEqual(update.writes, [0]);
    assert.match(texts(update), /reference updated/);
});

test("a validity change reports every change, fails and writes nothing, even with --update", () => {
    const flipped = entry({ actual: { language: "text", code: "Type Error [E1]: no\n", outputDiagnostics: "" } });
    const other = entry({ file: "c/d.md", actual: { language: "flix", code: "z\n", outputDiagnostics: "" } });
    for (const update of [false, true]) {
        const result = assess([flipped, other], { update });
        assert.equal(result.exitCode, 1);
        assert.deepEqual(result.writes, []);
        const text = texts(result);
        assert.match(text, /a\/b\.md: Flix now rejects the input/);
        assert.match(text, /c\/d\.md: reference changed/); // the other change is still reported
        assert.match(text, /Not writing any reference/);
    }
    const accepted = assess([entry({ saved: { language: "text", code: "Type Error [E1]: no\n" } })], { update: true });
    assert.match(texts(accepted), /Flix now accepts the input/);
    assert.equal(accepted.exitCode, 1);
});

test("output validity must match flixFormatInvalid", () => {
    const diagnostics = "Type Error [E6925]: bad\n";
    const nowInvalid = assess([entry({ actual: { language: "flix", code: "x\n", outputDiagnostics: diagnostics } })]);
    assert.equal(nowInvalid.exitCode, 1);
    assert.match(texts(nowInvalid), /Flix output validity changed[\s\S]*E6925/);
    const nowValid = assess([entry({ invalid: true, saved: { language: "flix", code: "x\n", diagnostics } })]);
    assert.equal(nowValid.exitCode, 1);
    assert.match(texts(nowValid), /Flix output validity changed/);
});

test("changed output diagnostics are reported and updated, unchanged ones are quiet unless verbose", () => {
    const base = { invalid: true, saved: { language: "flix", code: "x\n", diagnostics: "Type Error [E1]: a\n" } };
    const same = entry({ ...base, actual: { language: "flix", code: "x\n", outputDiagnostics: "Type Error [E1]: a\n" } });
    assert.equal(assess([same]).exitCode, 0);
    assert.doesNotMatch(texts(assess([same])), /fails to type-check/);
    assert.match(texts(assess([same], { verbose: true })), /fails to type-check:\nType Error \[E1\]: a/);
    const changed = entry({ ...base, actual: { language: "flix", code: "x\n", outputDiagnostics: "Type Error [E1]: a\nResolution Error [E2]: b\n" } });
    const check = assess([changed]);
    assert.equal(check.exitCode, 1);
    assert.match(texts(check), /output diagnostics changed\n@@[^\n]*\n Type Error \[E1\]: a\n\+Resolution Error \[E2\]: b/);
    assert.deepEqual(assess([changed], { update: true }).writes, [0]);
});

test("a crash is reported against its fixture, fails the run and keeps other results", () => {
    const result = assess([{ file: "x/y.md", crash: "java.lang.Boom\n\tat A.b\n" }, entry({ file: "c/d.md" })], { update: true });
    assert.equal(result.exitCode, 1);
    assert.deepEqual(result.writes, []);
    assert.match(texts(result), /x\/y\.md: the Flix driver crashed:\njava\.lang\.Boom/);
    assert.match(texts(result), /c\/d\.md: matches a Prettier snapshot/);
});

test("the Prettier comparison of a todo fixture talks about the desired output", () => {
    assert.match(texts(assess([entry({ status: "todo" })])), /matches the desired Output/);
    assert.match(texts(assess([entry({ status: "todo", outputs: [{ code: "q\n" }] })])), /differs from the desired Output/);
    assert.match(texts(assess([entry({ outputs: [{ code: "q\n" }] })])), /differs from Prettier snapshots/);
    assert.match(texts(assess([entry({ saved: { language: "text", code: "T\n" }, actual: { language: "text", code: "T\n", outputDiagnostics: "" } })])), /Flix declined to format/);
});

test("unifiedDiff shows hunks with context and is empty for equal texts", () => {
    assert.equal(unifiedDiff("a\nb\n", "a\nb\n"), "");
    assert.equal(unifiedDiff("a\nb\nc\n", "a\nB\nc\n"), "@@ -1,3 +1,3 @@\n a\n-b\n+B\n c");
    const lines = Array.from({ length: 20 }, (_, i) => `l${i}`);
    const edited = lines.map((l, i) => (i === 1 || i === 18 ? l.toUpperCase() : l));
    const diff = unifiedDiff(lines.join("\n") + "\n", edited.join("\n") + "\n");
    assert.equal(diff.split("\n").filter((l) => l.startsWith("@@")).length, 2);
    assert.equal(unifiedDiff("", "x\n"), "@@ -1,0 +1,1 @@\n+x");
});

test("the timeout scales with the fixtures and can be overridden", () => {
    assert.ok(timeoutMs(3) >= 60_000 + 3 * 10_000);
    assert.ok(timeoutMs(200) >= 200 * 10_000 + 10_000);
    assert.ok(timeoutMs(200) > timeoutMs(3));
    assert.equal(timeoutMs(200, { FLIX_FORMAT_TIMEOUT_MS: "5000" }), 5000);
    assert.equal(timeoutMs(3, { FLIX_FORMAT_TIMEOUT_MS: "" }), timeoutMs(3));
    assert.throws(() => timeoutMs(3, { FLIX_FORMAT_TIMEOUT_MS: "soon" }), /positive integer/);
});
