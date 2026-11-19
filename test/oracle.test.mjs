// The compiler oracle's own behavior that does not need the Flix compiler: argument validation,
// empty samples and the jar path. (The comparison itself needs Java and the pinned flix.jar; see
// the README and .github/workflows/flix-corpora.yml.)
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
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

// ---- the comparison itself, driven by a fake `java` so no compiler is needed ----
// The fake prints what the real compiler prints for a type error and behaves as FAKE_MODE says.


const fakeJava = join(work, "fake-java.sh");
writeFileSync(fakeJava, `#!/bin/sh
cmd="$3"
if [ "$cmd" = "--version" ]; then echo "The Flix Programming Language \${FAKE_FLIX_VERSION:-0.80.0}"; exit 0; fi
if [ -n "$FAKE_LOG" ] && [ -f flix.toml ]; then cat flix.toml >> "$FAKE_LOG"; fi
dir=$(basename "$PWD")
case "$FAKE_MODE" in
  hang) sleep 30; exit 0;;
  signal) kill -9 $$;;
  exitdiff)
    if [ "$cmd" = "build" ]; then
      echo "-- Type Error [E0001] ---- test/A.flix"; echo ">> boom"
      case "$dir" in original-*) exit 1;; *) exit 3;; esac
    fi;;
  *)
    if [ "$cmd" = "build" ]; then echo "-- Type Error [E0001] ---- test/A.flix"; echo ">> boom"; exit 1; fi;;
esac
`);
chmodSync(fakeJava, 0o755);
const posix = process.platform !== "win32";
const withFake = (extraEnv = {}) => ({ ...process.env, FLIX_ORACLE_JAVA: fakeJava, ...extraEnv });
const runFake = (args, env) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8", env: withFake(env) });

test("identical reports compare equal", { skip: !posix }, () => {
    const r = runFake([fakeJar, sources, "--jobs", "1"]);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /1 compared, 0 skipped/);
    assert.match(r.stdout, /identical for every compared file/);
});

test("the same diagnostics with a different exit status are a mismatch", { skip: !posix }, () => {
    const r = runFake([fakeJar, sources, "--jobs", "1"], { FAKE_MODE: "exitdiff" });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stderr, /MISMATCH A\.flix \(original: build, exit 1; other: build, exit 3\)/);
});

test("a timeout is a broken run, not a result", { skip: !posix }, () => {
    const r = runFake([fakeJar, sources, "--jobs", "1", "--timeout", "1"], { FAKE_MODE: "hang" });
    assert.equal(r.status, 2, r.stdout + r.stderr);
    assert.match(r.stderr, /harness failure.*timed out after 1 s/s);
});

test("a killed compiler is a broken run, not a result", { skip: !posix }, () => {
    const r = runFake([fakeJar, sources, "--jobs", "1"], { FAKE_MODE: "signal" });
    assert.equal(r.status, 2, r.stdout + r.stderr);
    assert.match(r.stderr, /harness failure.*killed by SIGKILL/s);
});

test("a compiler that cannot be started is a broken run", () => {
    const r = spawnSync(process.execPath, [script, fakeJar, sources], { encoding: "utf8", env: { ...process.env, FLIX_ORACLE_JAVA: join(work, "no-such-java") } });
    assert.equal(r.status, 2, r.stdout + r.stderr);
    assert.match(r.stderr, /harness failure/);
});

test("files the grammar cannot parse are skipped and counted", { skip: !posix }, () => {
    const mixed = join(work, "mixed");
    mkdirSync(mixed);
    writeFileSync(join(mixed, "A.flix"), "def a(): Int32 = 1\n");
    writeFileSync(join(mixed, "Bad.flix"), "def (\n");
    const r = runFake([fakeJar, mixed, "--jobs", "1"]);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /1 compared, 1 skipped \(do not parse\), 0 formatter failures/);
});

test("a run where every file is skipped is an error, not a success", { skip: !posix }, () => {
    const onlyBad = join(work, "only-bad");
    mkdirSync(onlyBad);
    writeFileSync(join(onlyBad, "Bad.flix"), "def (\n");
    const r = runFake([fakeJar, onlyBad]);
    assert.equal(r.status, 2, r.stdout + r.stderr);
    assert.match(r.stderr, /no file could be compared/);
});
