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
} from "../analysis/width-heatmap/heatmap-lib.mjs";
import { parseResultDocument } from "../scripts/sweep-results.mjs";

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
