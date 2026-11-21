// Unit tests for the logic behind `npm run review:sweep` and the comment-site test: building a
// comment variant, planning sites, judging one format run, reconciling failures with the known list,
// shrinking an input and diffing outputs. Small inputs and stub formatters; no sweep runs here.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { COMMENT_FORMS, withCommentAt } from "./lib.mjs";
import { checkFormat, checkSite, knownPlan, lineDiff, loadInputs, mergePlans, minimize, parseKnown, parsePositiveInt, parseWidths, planSites, reconcile, renderHunks, runSitePlan, selectShard } from "../scripts/review-sweep-lib.mjs";

const src = "def f(): Int32 = a.b + 1\n";

test("withCommentAt: forms, and glue behind a tight dot", () => {
    // tokens: def(0) f(2) ( ) : Int32 = a . b + 1; index 0 is `def`
    assert.equal(withCommentAt("def f(): Int32 = 1\n", 0, "line"), "def // note\n f(): Int32 = 1\n");
    assert.equal(withCommentAt("def f(): Int32 = 1\n", 0, "block"), "def /* note */  f(): Int32 = 1\n");
    assert.equal(withCommentAt("def f(): Int32 = 1\n", 0, "own"), "\n// own\ndef f(): Int32 = 1\n");
    const dot = planSites("def f(): Int32 = a.b\n", { every: 1, forms: ["line"], widths: [80] }).map((p) => p.token);
    const dotToken = dot[dot.length - 2];
    assert.match(withCommentAt("def f(): Int32 = a.b\n", dotToken, "line"), /a\.\/\/ note\nb/);
    assert.match(withCommentAt("def f(): Int32 = a.b\n", dotToken, "block"), /a\.\/\* note \*\/b/);
    assert.throws(() => withCommentAt(src, 0, "other"), /unknown comment form/);
});

test("planSites: all combinations, or a rotating sample that keeps glued sites", () => {
    const widths = [40, 60, 100];
    const all = planSites(src, { every: 1, forms: COMMENT_FORMS, widths });
    const sites = new Set(all.map((p) => p.token));
    assert.equal(all.length, sites.size * 9);
    const sampled = planSites(src, { every: 6, forms: COMMENT_FORMS, widths });
    assert.ok(sampled.length < all.length / 4);
    assert.equal(new Set(sampled.map((p) => p.token)).size, sampled.length); // one combination per site
    const long = planSites(src.repeat(40), { every: 6, forms: COMMENT_FORMS, widths });
    assert.equal(new Set(long.map((p) => `${p.form}|${p.width}`)).size, 9); // the rotation covers every combination
    const glued = planSites("def f(): Int32 = a.b.c.d.e.f.g\n", { every: 1000, forms: ["line"], widths: [80] });
    assert.ok(glued.length >= 5); // every tight dot is kept although the sample is sparse
});

test("checkFormat: names the way a run fails", async () => {
    const ok = (t) => t;
    assert.equal(await checkFormat(async (t) => ok(t), src, 80), null);
    assert.equal((await checkFormat(async () => { throw new Error("boom\nmore"); }, src, 80)).kind, "throw");
    assert.equal((await checkFormat(async () => "def f(: = =\n", src, 80)).kind, "unparsable");
    assert.equal((await checkFormat(async () => "def g(): Int32 = a.b + 1\n", src, 80)).kind, "program"); // tokens differ
    let n = 0;
    const flip = async (t) => (n++ % 2 === 0 ? t.trimEnd() + "\n\n" : t.trimEnd() + "\n"); // second pass differs
    const r = await checkFormat(flip, src, 80);
    assert.equal(r.kind, "not-idempotent");
    assert.notEqual(r.output, r.second);
});

test("checkSite: skips a variant that does not parse, reports a break, passes a sound format", async () => {
    const identity = async (t) => t;
    const passes = await checkSite(identity, src, 0, "line", 80);
    assert.equal(passes.skipped, false);
    assert.equal(passes.kind, undefined);
    // a variant that does not parse is skipped, not counted as a failure
    assert.equal((await checkSite(identity, "def (", 0, "line", 80)).skipped, true);
    const dropComment = async (t) => t.replace(/\/\/ note\n?/, "");
    const lost = await checkSite(dropComment, src, 0, "line", 80);
    assert.equal(lost.kind, "program");
    assert.match(lost.detail, /comments differ/);
});

const entry = (extra = {}) => ({ file: "a.md", width: 60, form: "block", token: 7, kind: "not-idempotent", issue: "#135", ...extra });
const fail = (extra = {}) => ({ file: "a.md", width: 60, form: "block", token: 7, kind: "not-idempotent", ...extra });
const key = (e) => [e.file, e.width, e.form, e.token].join("|");

test("reconcile: a failure needs an entry of the same kind, an entry needs its failure", () => {
    const known = [entry()];
    assert.deepEqual(reconcile(known, [fail()], new Set([key(entry())])).messages, []);
    // a new failure without an entry
    const unlisted = reconcile(known, [fail(), fail({ token: 8 })], new Set([key(entry()), key(fail({ token: 8 }))]));
    assert.equal(unlisted.unknown.length, 1);
    assert.match(unlisted.messages[0], /unknown failure: a\.md width=60 form=block token=8/);
    // a listed failure that passes now
    const fixed = reconcile(known, [], new Set([key(entry())]));
    assert.deepEqual(fixed.messages, ["known failure now passes: remove it from the list (issue #135): a.md width=60 form=block token=7 not-idempotent"]);
    // a listed failure that fails in another way is unknown and does not count as fixed
    const other = reconcile(known, [fail({ kind: "unparsable" })], new Set([key(entry())]));
    assert.equal(other.unknown.length, 1);
    assert.equal(other.fixed.length, 0);
    // an entry whose combination was not run is not judged
    assert.deepEqual(reconcile(known, [], new Set()).messages, []);
});

test("parseKnown: checks the entries; knownPlan re-checks listed sites; mergePlans drops repeats", () => {
    assert.equal(parseKnown(JSON.stringify({ failures: [entry()] })).length, 1);
    assert.throws(() => parseKnown("{}"), /"failures" array/);
    assert.throws(() => parseKnown(JSON.stringify({ failures: [entry({ kind: "throw" })] })), /kind must be one of/);
    assert.throws(() => parseKnown(JSON.stringify({ failures: [entry({ issue: "135" })] })), /issue must look like/);
    assert.throws(() => parseKnown(JSON.stringify({ failures: [{ file: "a.md" }] })), /without "width"/);
    const plan = knownPlan([entry(), entry({ file: "b.md" }), { file: "a.md", width: 40, kind: "not-idempotent", issue: "#92" }], "a.md");
    assert.deepEqual(plan, [{ token: 7, form: "block", width: 60 }]);
    assert.equal(mergePlans(plan, plan, [{ token: 1, form: "line", width: 40 }]).length, 2);
});

test("minimize: keeps only the lines the failure needs", async () => {
    const text = ["a", "b", "BAD", "c", "d", "e"].join("\n");
    assert.equal(await minimize(text, async (t) => t.includes("BAD")), "BAD");
    assert.equal(await minimize(text, async (t) => t.includes("a") && t.includes("e")), "a\ne");
    assert.equal(await minimize("x", async () => false), "x"); // never returns a text that does not fail
});

test("lineDiff: hunks with positions; equal texts give none", () => {
    assert.deepEqual(lineDiff("a\nb\n", "a\nb\n"), []);
    assert.deepEqual(lineDiff("a\nb\nc", "a\nB\nc"), [{ aStart: 2, bStart: 2, removed: ["b"], added: ["B"] }]);
    assert.deepEqual(lineDiff("a\nc", "a\nb\nc"), [{ aStart: 2, bStart: 2, removed: [], added: ["b"] }]);
    const two = lineDiff("1\n2\n3\n4\n5", "1\nX\n3\n4\nY\nZ");
    assert.equal(two.length, 2);
    assert.equal(renderHunks(two), "@@ -2,1 +2,1 @@\n-2\n+X\n@@ -5,1 +5,2 @@\n-5\n+Y\n+Z");
});

test("runSitePlan: records each site it ran, so a listed site that passes is reported", async () => {
    const { failures, checked } = await runSitePlan(async (t) => t, { name: "a.md", source: src }, [{ token: 0, form: "line", width: 80 }]);
    assert.deepEqual(failures, []);
    assert.deepEqual([...checked], ["a.md|80|line|0"]);
    const listed = [{ file: "a.md", width: 80, form: "line", token: 0, kind: "not-idempotent", issue: "#1" }];
    assert.equal(reconcile(listed, failures, checked).fixed.length, 1);
});

test("parseKnown: rejects duplicate entry keys", () => {
    assert.throws(
        () => parseKnown(JSON.stringify({ failures: [entry(), entry({ kind: "unparsable", issue: "#2" })] })),
        /duplicate entry/,
    );
});

test("parseWidths / parsePositiveInt: reject invalid CLI values", () => {
    assert.deepEqual(parseWidths(undefined, [40, 60]), [40, 60]);
    assert.deepEqual(parseWidths("40, 80", [1]), [40, 80]);
    assert.throws(() => parseWidths("4O", [40]), /positive integers/);
    assert.throws(() => parseWidths("0,40", [40]), /positive integers/);
    assert.equal(parsePositiveInt("every", "6"), 6);
    assert.throws(() => parsePositiveInt("every", "abc"), /positive integer/);
    assert.throws(() => parsePositiveInt("max", "0"), /positive integer/);
});

test("selectShard: k/n partitions; rejects a bad shard", () => {
    const items = ["a", "b", "c", "d"];
    assert.deepEqual(selectShard(items, undefined), items);
    assert.deepEqual(selectShard(items, "1/2"), ["a", "c"]);
    assert.deepEqual(selectShard(items, "2/2"), ["b", "d"]);
    assert.throws(() => selectShard(items, "0/2"), /k\/n/);
    assert.throws(() => selectShard(items, "3/2"), /k\/n/);
    assert.throws(() => selectShard(items, "x"), /k\/n/);
});

test("loadInputs: names files outside the repo relative to the parent of the given path", () => {
    const root = mkdtempSync(join(tmpdir(), "sweep-name-"));
    const lib = join(root, "library");
    mkdirSync(lib);
    writeFileSync(join(lib, "MutDeque.flix"), "def f(): Int32 = 1\n");
    try {
        assert.deepEqual(loadInputs([lib], { base: process.cwd(), fixtures: false }).map((i) => i.name), ["library/MutDeque.flix"]);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
