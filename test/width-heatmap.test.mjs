// Width heatmap helpers and the pinned #201 sample (#207). Optional R is not required.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
    changedWidthsTable,
    expandHeatmapRows,
    formatChangedWidthsTsv,
    renderHeatmapSvg,
    STATUS_COLORS,
} from "../analysis/width-heatmap/heatmap-lib.mjs";
import * as results from "../scripts/sweep-results.mjs";
import { buildResultDocument, makeCase, parseResultDocument } from "../scripts/sweep-results.mjs";

const sample = join(dirname(fileURLToPath(import.meta.url)), "..", "analysis", "width-heatmap", "sample");
const load = (name) => JSON.parse(readFileSync(join(sample, name), "utf8"));

test("sample exports are schema v1 and cover both #201 repros", () => {
    const base = parseResultDocument(load("base.json"));
    const cand = parseResultDocument(load("candidate.json"));
    assert.equal(base.command, "idempotence");
    assert.equal(cand.command, "idempotence");
    const files = new Set(cand.cases.map((c) => c.file));
    assert.ok(files.has("equals-own-line"));
    assert.ok(files.has("hug-match-own-line"));
});

test("sample: failures at 30 and 35, skip, and missing widths on a full axis", () => {
    const base = load("base.json");
    const cand = load("candidate.json");
    const axis = Array.from({ length: 141 }, (_, i) => i + 20);
    const { rows } = expandHeatmapRows(base, cand, { widths: axis });
    const candRows = rows.filter((r) => r.role === "candidate");
    for (const file of ["equals-own-line", "hug-match-own-line"]) {
        assert.equal(candRows.find((r) => r.file === file && r.width === 30)?.status, "fail");
        assert.equal(candRows.find((r) => r.file === file && r.width === 35)?.status, "fail");
        assert.equal(candRows.find((r) => r.file === file && r.width === 40)?.status, "pass");
        assert.equal(candRows.find((r) => r.file === file && r.width === 105)?.status, "missing");
    }
    assert.equal(candRows.find((r) => r.file === "hug-match-own-line" && r.width === 50)?.status, "skipped");
    const statuses = new Set(candRows.map((r) => r.status));
    for (const s of ["pass", "fail", "skipped", "missing"]) assert.ok(statuses.has(s), s);
});

test("changedWidthsTable lists 30 and 35 as pass->fail", () => {
    const table = changedWidthsTable(load("base.json"), load("candidate.json"));
    const fails = table.filter((r) => r.from === "pass" && r.to === "fail");
    assert.ok(fails.length >= 2);
    for (const row of fails) {
        assert.deepEqual(row.widths, [30, 35]);
    }
    const tsv = formatChangedWidthsTsv(table);
    assert.match(tsv, /^file\tfrom\tto\twidths\n/);
    assert.match(tsv, /equals-own-line\tpass\tfail\t30,35/);
});

test("renderHeatmapSvg marks each status", () => {
    const svg = renderHeatmapSvg(load("base.json"), load("candidate.json"), {
        widths: Array.from({ length: 141 }, (_, i) => i + 20),
    });
    assert.match(svg, /data-status="pass"/);
    assert.match(svg, /data-status="fail"/);
    assert.match(svg, /data-status="skipped"/);
    assert.match(svg, /data-status="missing"/);
    assert.match(svg, /equals-own-line/);
});

// A sites export holds several cases (one per form) in one file+width cell.
const sitesDoc = (rev, statuses, widths = [40]) =>
    buildResultDocument({
        command: "sites",
        formatter: { revision: rev.repeat(40) },
        config: { widths },
        cases: statuses.flatMap((status, i) =>
            widths.map((width) => makeCase({ file: "f", width, form: `form${i}`, token: "3", status })),
        ),
    });
const candRow = (doc, base, width = 40) =>
    expandHeatmapRows(base, doc).rows.find((r) => r.role === "candidate" && r.width === width);

test("a cell with several cases shows the worst status (fail > skipped > pass), in any order", () => {
    const base = sitesDoc("a", ["pass", "pass"]);
    for (const [statuses, want] of [
        [["pass", "fail"], "fail"],
        [["fail", "pass"], "fail"],
        [["pass", "skipped"], "skipped"],
        [["skipped", "pass"], "skipped"],
        [["skipped", "fail", "pass"], "fail"],
        [["pass", "pass"], "pass"],
    ]) {
        assert.equal(candRow(sitesDoc("b", statuses), base).status, want, statuses.join());
    }
});

test("changedWidthsTable reports a failing form of a sites export", () => {
    const table = changedWidthsTable(sitesDoc("a", ["pass", "pass"], [40, 50]), sitesDoc("b", ["pass", "fail"], [40, 50]));
    assert.deepEqual(table, [{ file: "f", from: "pass", to: "fail", widths: [40, 50] }]);
    assert.deepEqual(changedWidthsTable(sitesDoc("a", ["pass"]), sitesDoc("b", ["pass"])), []);
});

test("worstCaseStatus follows the schema-v1 ranking", () => {
    assert.deepEqual(results.CASE_STATUS_SEVERITY, ["pass", "skipped", "fail"]);
    assert.equal(results.worstCaseStatus(["pass", "skipped"]), "skipped");
    assert.equal(results.worstCaseStatus(["fail", "skipped", "pass"]), "fail");
    assert.equal(results.worstCaseStatus(["pass"]), "pass");
    assert.throws(() => results.worstCaseStatus(["bogus"]), /unknown case status/);
});

test("the table lists only changed cells, sorted by file, with ascending widths", () => {
    const mk = (rev, entries) =>
        buildResultDocument({
            command: "idempotence",
            formatter: { revision: rev.repeat(40) },
            config: { widths: [] },
            cases: entries.map(([file, width, status]) => makeCase({ file, width, status, reason: "r" })),
        });
    const base = mk("a", [["b", 60, "pass"], ["b", 20, "pass"], ["a", 30, "pass"], ["a", 40, "pass"]]);
    const cand = mk("b", [["b", 60, "fail"], ["b", 20, "fail"], ["a", 30, "skipped"], ["a", 40, "pass"]]);
    assert.deepEqual(changedWidthsTable(base, cand), [
        { file: "a", from: "pass", to: "skipped", widths: [30] },
        { file: "b", from: "pass", to: "fail", widths: [20, 60] },
    ]);
    const { widths } = expandHeatmapRows(base, cand);
    assert.deepEqual(widths, [20, 30, 40, 60]);
});

test("each status has its own color in the SVG, and the base panel shows base statuses", () => {
    assert.equal(new Set(Object.values(STATUS_COLORS)).size, 4);
    assert.deepEqual(STATUS_COLORS, { pass: "#2ca02c", fail: "#d62728", skipped: "#ff7f0e", missing: "#c7c7c7" });
    const base = sitesDoc("a", ["fail"], [40]);
    const cand = sitesDoc("b", ["skipped"], [40, 50]);
    const svg = renderHeatmapSvg(base, cand);
    const rects = [...svg.matchAll(/<rect [^>]*fill="(#[0-9a-f]{6})" data-status="(\w+)" data-file="f" data-width="(\d+)"/g)];
    // Panels are drawn base first, then candidate.
    assert.deepEqual(
        rects.map((m) => [m[2], m[1], m[3]]),
        [
            ["fail", STATUS_COLORS.fail, "40"],
            ["missing", STATUS_COLORS.missing, "50"],
            ["skipped", STATUS_COLORS.skipped, "40"],
            ["skipped", STATUS_COLORS.skipped, "50"],
        ],
    );
});
