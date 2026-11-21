// Fixtures for the versioned sweep export, shard merge, and review summary (#206).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
    RESULT_SCHEMA_VERSION,
    buildResultDocument,
    caseId,
    compareSweepResults,
    makeCase,
    mergeShardResults,
    parseResultDocument,
    readAuditLayoutChanges,
    renderReviewSummary,
    sortCases,
} from "../scripts/sweep-results.mjs";
import { parseSweepArgs } from "../scripts/review-sweep-lib.mjs";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "sweep-results");
const load = (name) => JSON.parse(readFileSync(join(fixtures, name), "utf8"));

test("caseId and makeCase: stable ids match known-failure entry keys", () => {
    assert.equal(caseId({ file: "a.md", width: 60, form: "block", token: 7 }), "a.md|60|block|7");
    assert.equal(caseId({ file: "a.flix", width: 40 }), "a.flix|40|plain|-");
    const c = makeCase({ file: "a.flix", width: 40, status: "pass" });
    assert.equal(c.id, "a.flix|40|plain|-");
    assert.equal(c.status, "pass");
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
    assert.deepEqual(a.fixedFailures.map((c) => c.id), b.fixedFailures.map((c) => c.id));
    assert.equal(JSON.stringify(a.newFailures), JSON.stringify(b.newFailures));
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

test("mergeShardResults: union matches the unsharded case set", () => {
    const s1 = load("shard-1.json");
    const s2 = load("shard-2.json");
    const merged = mergeShardResults([s1, s2]);
    assert.equal(merged.config.shard, null);
    assert.equal(merged.cases.length, 4);
    assert.deepEqual(
        merged.cases.map((c) => c.id),
        ["a.flix|40|plain|-", "a.flix|80|plain|-", "b.flix|40|plain|-", "b.flix|80|plain|-"],
    );
    const unsharded = buildResultDocument({
        command: "idempotence",
        formatter: { revision: s1.formatter.revision },
        corpus: { revision: s1.corpus.revision, inputCount: 2, fingerprint: "shard-corpus" },
        config: { ...s1.config, shard: null },
        cases: [...s1.cases, ...s2.cases].map((c) => makeCase(c)),
    });
    assert.deepEqual(
        merged.cases.map((c) => c.id),
        unsharded.cases.map((c) => c.id),
    );
    assert.equal(merged.cases.filter((c) => c.status === "fail").length, unsharded.cases.filter((c) => c.status === "fail").length);
});

test("renderReviewSummary: layout-only change from the audit report", () => {
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
    assert.match(md, /https:\/\/example\.test\/artifact/);
    // Same inputs → same Markdown
    const again = renderReviewSummary({
        sweep: { base: load("base-sites.json"), candidate: load("candidate-sites.json") },
        audit: join(fixtures, "audit"),
        artifactUrl: "https://example.test/artifact",
    });
    assert.equal(md, again);
});

test("readAuditLayoutChanges: absent directory is not present", () => {
    const missing = readAuditLayoutChanges(join(fixtures, "no-such-audit"));
    assert.equal(missing.present, false);
    const md = renderReviewSummary({ audit: join(fixtures, "no-such-audit") });
    assert.match(md, /absent/);
    assert.match(md, /not green for layout/);
});

test("parseResultDocument: rejects a wrong schema version", () => {
    assert.throws(
        () => parseResultDocument({ schemaVersion: 99, command: "sites", formatter: { revision: "x" }, cases: [] }),
        /unsupported schemaVersion/,
    );
    assert.equal(parseResultDocument(load("base-sites.json")).schemaVersion, RESULT_SCHEMA_VERSION);
});

test("parseSweepArgs: accepts --export and --seed", () => {
    const o = parseSweepArgs(["sites", "--export", "out.json", "--seed", "7"]);
    assert.equal(o.export, "out.json");
    assert.equal(o.seed, 7);
});

test("sortCases: deterministic order", () => {
    const ids = sortCases([
        makeCase({ file: "b.flix", width: 40, status: "pass" }),
        makeCase({ file: "a.flix", width: 80, status: "fail", kind: "not-idempotent", reason: "x" }),
        makeCase({ file: "a.flix", width: 40, status: "pass" }),
    ]).map((c) => c.id);
    assert.deepEqual(ids, ["a.flix|40|plain|-", "a.flix|80|plain|-", "b.flix|40|plain|-"]);
});
