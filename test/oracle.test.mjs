// The compiler oracle's own behavior that does not need the Flix compiler: argument validation,
// empty samples and the jar path. (The comparison itself needs Java and the pinned flix.jar; see
// the README and .github/workflows/flix-corpora.yml.)
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const script = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts", "oracle.mjs");
const run = (args, cwd) => spawnSync(process.execPath, [script, ...args], { cwd, encoding: "utf8" });

const work = mkdtempSync(join(tmpdir(), "oracle-test-"));
const sources = join(work, "sources");
mkdirSync(sources);
writeFileSync(join(sources, "A.flix"), "def a(): Int32 = 1\n");
const emptyDir = join(work, "empty");
mkdirSync(emptyDir);
const fakeJar = join(work, "fake.jar");
writeFileSync(fakeJar, "not a jar");

for (const [args, message] of [
    [["--jobs", "0"], /--jobs must be a positive integer, got "0"/],
    [["--jobs", "abc"], /--jobs must be a positive integer, got "abc"/],
    [["--jobs", "1.5"], /--jobs must be a positive integer/],
    [["--every", "0"], /--every must be a positive integer, got "0"/],
    [["--every", "2.5"], /--every must be a positive integer/],
    [["--every", "-3"], /--every must be a positive integer/],
]) {
    test(`rejects ${args.join(" ")}`, () => {
        const r = run([fakeJar, sources, ...args]);
        assert.equal(r.status, 2, r.stderr);
        assert.match(r.stderr, message);
    });
}

test("rejects an empty source directory instead of reporting success", () => {
    const r = run([fakeJar, emptyDir]);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /no \.flix files selected/);
});

test("rejects a sample that selects nothing", () => {
    // Only the Prelude is excluded from the selection, so a directory with just Prelude.flix is empty.
    const preludeOnly = join(work, "prelude-only");
    mkdirSync(preludeOnly);
    writeFileSync(join(preludeOnly, "Prelude.flix"), "");
    assert.equal(run([fakeJar, preludeOnly]).status, 2);
});

test("rejects a missing jar with its absolute path", () => {
    const r = run(["nothere.jar", sources], work);
    assert.equal(r.status, 2);
    assert.match(r.stderr, new RegExp(`cannot read the jar ${work}/nothere\\.jar`));
});

test("checks the digest of a relative jar path and then runs it by absolute path", (t) => {
    if (spawnSync("java", ["-version"]).status !== 0) return t.skip("java is not installed");
    const pin = join(work, "pin.json");
    writeFileSync(pin, JSON.stringify({ oracleArtifact: { sha256: createHash("sha256").update("not a jar").digest("hex") } }));
    const r = run(["fake.jar", "sources", "--pin", pin], work);
    // The digest matched through the relative path, and Java then reached the file from the
    // throwaway project's directory: it complains about the content, not about a missing file.
    assert.equal(r.status, 2, r.stderr);
    assert.doesNotMatch(r.stderr, /Unable to access jarfile/);
    assert.doesNotMatch(r.stderr, /does not match the pinned/);
    assert.match(r.stderr, /corrupt jarfile|Invalid or corrupt/i);
});
