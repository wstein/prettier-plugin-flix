// Fixtures for the versioned sweep export, shard merge, and review summary (#206).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import {
    RESULT_SCHEMA_VERSION,
    buildResultDocument,
    caseId,
    compareSweepResults,
    configKey,
    corpusFingerprint,
    exportPathForCommand,
    makeCase,
    mergeShardResults,
    parseResultDocument,
    parseShardSpec,
    readAuditLayoutChanges,
    renderReviewSummary,
    sortCases,
} from "../scripts/sweep-results.mjs";
import { parseSweepArgs, runSitePlan } from "../scripts/review-sweep-lib.mjs";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "sweep-results");
const load = (name) => JSON.parse(readFileSync(join(fixtures, name), "utf8"));

test("caseId and makeCase: stable ids; rejects unknown status", () => {
    assert.equal(caseId({ file: "a.md", width: 60, form: "block", token: 7 }), "a.md|60|block|7");
    assert.equal(caseId({ file: "a.flix", width: 40 }), "a.flix|40|plain|-");
    const c = makeCase({ file: "a.flix", width: 40, status: "pass" });
    assert.equal(c.id, "a.flix|40|plain|-");
    assert.equal(c.status, "pass");
    assert.throws(() => makeCase({ file: "a.flix", width: 40, status: "ok" }), /unknown case status/);
});

test("configKey: every, only, seed, known, paths, fingerprint and shard matter", () => {
    const base = load("base-sites.json");
    const tweak = (fn) => {
        const d = structuredClone(base);
        fn(d);
        return configKey(d);
    };
    const key = configKey(base);
    assert.notEqual(tweak((d) => { d.config.every = 6; }), key);
    assert.notEqual(tweak((d) => { d.config.only = "x"; }), key);
    assert.notEqual(tweak((d) => { d.config.seed = 1; }), key);
    assert.notEqual(tweak((d) => { d.config.known = "k.json"; }), key);
    assert.notEqual(tweak((d) => { d.corpus.paths = ["lib"]; }), key);
    assert.notEqual(tweak((d) => { d.corpus.fingerprint = "other"; }), key);
    assert.notEqual(tweak((d) => { d.config.shard = "1/3"; }), key);
});

test("corpusFingerprint: null-byte separators distinguish concatenated names", () => {
    assert.notEqual(corpusFingerprint(["ab", "c"]), corpusFingerprint(["a", "bc"]));
    assert.equal(corpusFingerprint(["b", "a"]), corpusFingerprint(["a", "b"]));
});

test("compareSweepResults: new failure, fixed failure, and stable order", () => {
    const base = load("base-sites.json");
    const candidate = load("candidate-sites.json");
    const a = compareSweepResults(base, candidate);
    const b = compareSweepResults(base, candidate);
    assert.equal(a.compatible, true);
    assert.equal(a.incomplete, false);
    assert.deepEqual(a.newFailures.map((c) => c.id), ["a.flix|60|line|0"]);
    assert.deepEqual(a.fixedFailures.map((c) => c.id), ["a.flix|40|line|0"]);
    assert.deepEqual(a.ongoingFailures.map((c) => c.id), ["b.flix|40|block|1"]);
    assert.deepEqual(a.newFailures.map((c) => c.id), b.newFailures.map((c) => c.id));
    assert.equal(JSON.stringify(a.newFailures), JSON.stringify(b.newFailures));
});

test("compareSweepResults: skipped candidate is not a fix; missing base id is incomplete", () => {
    const base = load("base-sites.json");
    const candidate = structuredClone(load("candidate-sites.json"));
    // Turn the fixed case into skipped instead of pass.
    const fixed = candidate.cases.find((c) => c.id === "a.flix|40|line|0");
    fixed.status = "skipped";
    fixed.reason = "variant does not parse";
    delete fixed.kind;
    const skipped = compareSweepResults(base, candidate);
    assert.equal(skipped.incomplete, true);
    assert.equal(skipped.fixedFailures.length, 0);
    assert.match(skipped.reason, /missing or skipped/);

    const partial = structuredClone(load("candidate-sites.json"));
    partial.cases = partial.cases.filter((c) => c.id !== "b.flix|40|block|1");
    const missing = compareSweepResults(base, partial);
    assert.equal(missing.incomplete, true);
    assert.deepEqual(missing.missingFromCandidate.map((c) => c.id), ["b.flix|40|block|1"]);
});

test("compareSweepResults: partial shard candidate is incomplete", () => {
    const shard = load("shard-1.json");
    const cmp = compareSweepResults(null, shard);
    assert.equal(cmp.incomplete, true);
    assert.match(cmp.reason, /partial shard/);
});

test("compareSweepResults: empty candidate is incomplete and never green", () => {
    const empty = load("empty-candidate.json");
    const cmp = compareSweepResults(load("base-sites.json"), empty);
    assert.equal(cmp.incomplete, true);
    assert.match(cmp.reason, /no cases/);
    assert.equal(cmp.counts.cases, 0);
    const md = renderReviewSummary({ sweep: { base: load("base-sites.json"), candidate: empty } });
    assert.match(md, /incomplete/);
    assert.match(md, /not green/);
});

test("compareSweepResults: absent base is incomplete; incompatible config is flagged", () => {
    const cand = load("candidate-sites.json");
    const absent = compareSweepResults(null, cand);
    assert.equal(absent.incomplete, true);
    assert.match(absent.reason, /base export absent/);
    const other = structuredClone(cand);
    other.config.widths = [40, 80];
    const bad = compareSweepResults(load("base-sites.json"), other);
    assert.equal(bad.compatible, false);
    assert.match(bad.reason, /incompatible/);
});

test("mergeShardResults: complete set matches unsharded counts; rejects a missing shard", () => {
    const s1 = load("shard-1.json");
    const s2 = load("shard-2.json");
    const merged = mergeShardResults([s1, s2]);
    assert.equal(merged.config.shard, null);
    assert.equal(merged.cases.length, 4);
    assert.equal(merged.corpus.inputCount, 2);
    assert.equal(merged.corpus.fingerprint, corpusFingerprint(["a.flix", "b.flix"]));
    assert.deepEqual(
        merged.cases.map((c) => c.id),
        ["a.flix|40|plain|-", "a.flix|80|plain|-", "b.flix|40|plain|-", "b.flix|80|plain|-"],
    );
    assert.throws(() => mergeShardResults([s1]), /incomplete shard set|missing shard/);
    assert.throws(() => mergeShardResults([s1, { ...s2, config: { ...s2.config, shard: "1/2" } }]), /duplicate shard/);
});

test("mergeShardResults: rejects conflicting cases and incompatible config or revision", () => {
    const s1 = load("shard-1.json");
    const s2 = load("shard-2.json");
    const conflict = structuredClone(s2);
    conflict.cases = [...s1.cases.map((c) => ({ ...c, status: "pass" })), ...s2.cases];
    assert.throws(() => mergeShardResults([s1, conflict]), /conflicting case/);
    const badCfg = structuredClone(s2);
    badCfg.config.widths = [40];
    assert.throws(() => mergeShardResults([s1, badCfg]), /incompatible shard config/);
    const badRev = structuredClone(s2);
    badRev.formatter.revision = "dddddddddddddddddddddddddddddddddddddddd";
    assert.throws(() => mergeShardResults([s1, badRev]), /formatter revision/);
    assert.throws(() => mergeShardResults([{ ...s1, config: { ...s1.config, shard: null } }, s2]), /requires config\.shard/);
});

test("renderReviewSummary: layout-only change; approved layouts omitted; absent sweep is explicit", () => {
    const md = renderReviewSummary({
        sweep: { base: load("base-sites.json"), candidate: load("candidate-sites.json") },
        audit: join(fixtures, "audit"),
        artifactUrl: "https://example.test/artifact",
    });
    assert.match(md, /New failures/);
    assert.match(md, /Fixed failures/);
    assert.match(md, /layout-change cases · 2/);
    assert.match(md, /book\.example-one/);
    assert.match(md, /wrapping/);
    assert.doesNotMatch(md, /website\.example-two/); // approved
    assert.match(md, /https:\/\/example\.test\/artifact/);
    const again = renderReviewSummary({
        sweep: { base: load("base-sites.json"), candidate: load("candidate-sites.json") },
        audit: join(fixtures, "audit"),
        artifactUrl: "https://example.test/artifact",
    });
    assert.equal(md, again);

    const auditOnly = renderReviewSummary({ audit: join(fixtures, "audit") });
    assert.match(auditOnly, /no `--base` \/ `--candidate`/);
    assert.doesNotMatch(auditOnly, /incomplete \(candidate export absent\)/);
});

test("readAuditLayoutChanges: absent or malformed report is not present", () => {
    const missing = readAuditLayoutChanges(join(fixtures, "no-such-audit"));
    assert.equal(missing.present, false);
    const dir = mkdtempSync(join(tmpdir(), "audit-bad-"));
    try {
        writeFileSync(join(dir, "report.json"), "{ not json");
        assert.equal(readAuditLayoutChanges(dir).present, false);
        writeFileSync(join(dir, "report.json"), JSON.stringify({ totals: {} }));
        assert.equal(readAuditLayoutChanges(dir).present, false);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});

test("parseResultDocument: rejects a wrong schema version or invalid case", () => {
    assert.throws(
        () => parseResultDocument({ schemaVersion: 99, command: "sites", formatter: { revision: "x" }, cases: [] }),
        /unsupported schemaVersion/,
    );
    assert.throws(
        () => parseResultDocument({ schemaVersion: 1, command: "sites", formatter: { revision: "x" }, cases: [{ id: "a", status: "weird" }] }),
        /invalid case/,
    );
    assert.equal(parseResultDocument(load("base-sites.json")).schemaVersion, RESULT_SCHEMA_VERSION);
});

test("parseSweepArgs / exportPathForCommand / parseShardSpec", () => {
    const o = parseSweepArgs(["sites", "--export", "out.json", "--seed", "7"]);
    assert.equal(o.export, "out.json");
    assert.equal(o.seed, 7);
    assert.equal(exportPathForCommand("out.json", "sites"), "out.sites.json");
    assert.equal(exportPathForCommand("out", "idempotence"), "out.idempotence");
    assert.deepEqual(parseShardSpec("2/3"), { k: 2, n: 3 });
    assert.equal(parseShardSpec(null), null);
    assert.throws(() => parseShardSpec("0/2"), /invalid shard/);
});

test("runSitePlan export cases: pass, fail, and skipped outcomes", async () => {
    const src = "def f(): Int32 = 1\n";
    const plan = [
        { token: 0, form: "line", width: 80 },
        { token: 0, form: "block", width: 80 },
    ];
    const ok = await runSitePlan(async (t) => t, { name: "a.flix", source: src }, plan);
    assert.equal(ok.cases.length, 2);
    assert.ok(ok.cases.every((c) => c.status === "pass"));
    const drop = await runSitePlan(async (t) => t.replace(/\/\/ note\n?/, ""), { name: "a.flix", source: src }, [plan[0]]);
    assert.equal(drop.cases[0].status, "fail");
    assert.equal(drop.cases[0].kind, "program");
    const skip = await runSitePlan(async (t) => t, { name: "a.flix", source: "def (" }, [plan[0]]);
    assert.equal(skip.cases[0].status, "skipped");
});

test("sortCases: deterministic order", () => {
    const ids = sortCases([
        makeCase({ file: "b.flix", width: 40, status: "pass" }),
        makeCase({ file: "a.flix", width: 80, status: "fail", kind: "not-idempotent", reason: "x" }),
        makeCase({ file: "a.flix", width: 40, status: "pass" }),
    ]).map((c) => c.id);
    assert.deepEqual(ids, ["a.flix|40|plain|-", "a.flix|80|plain|-", "b.flix|40|plain|-"]);
});
