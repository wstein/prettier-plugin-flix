// Rebuild the pinned #201-style sample exports (failures at 30 and 35, a skip,
// and a missing width band). Does not run the formatter.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildIdempotenceGrid, changedWidthsTable, formatChangedWidthsTsv, renderHeatmapSvg } from "./heatmap-lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const sampleDir = join(here, "sample");
const outDir = join(here, "out");
mkdirSync(sampleDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

const FILES = ["equals-own-line", "hug-match-own-line"];
// Incomplete range: omit 100..110 so those cells are missing in both panels when
// the plot asks for the full 20..160 axis.
const ALL_WIDTHS = [];
for (let w = 20; w <= 160; w++) {
    if (w >= 100 && w <= 110) continue;
    ALL_WIDTHS.push(w);
}
const AXIS_WIDTHS = [];
for (let w = 20; w <= 160; w++) AXIS_WIDTHS.push(w);

function casesFor(failAt, { skipAt } = {}) {
    const cases = [];
    for (const file of FILES) {
        for (const width of ALL_WIDTHS) {
            if (skipAt && file === "hug-match-own-line" && width === skipAt) {
                cases.push({ file, width, status: "skipped", reason: "variant does not parse" });
            } else if (failAt.includes(width)) {
                cases.push({ file, width, status: "fail", kind: "not-idempotent", reason: "not idempotent" });
            } else {
                cases.push({ file, width, status: "pass" });
            }
        }
    }
    return cases;
}

const base = buildIdempotenceGrid({
    revision: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    widths: ALL_WIDTHS,
    cases: casesFor([]),
});
const candidate = buildIdempotenceGrid({
    revision: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    widths: ALL_WIDTHS,
    cases: casesFor([30, 35], { skipAt: 50 }),
    createdAt: "2026-11-21T01:00:00.000Z",
});

writeFileSync(join(sampleDir, "base.json"), `${JSON.stringify(base, null, 2)}\n`);
writeFileSync(join(sampleDir, "candidate.json"), `${JSON.stringify(candidate, null, 2)}\n`);

const table = changedWidthsTable(base, candidate);
writeFileSync(join(sampleDir, "changed-widths.tsv"), formatChangedWidthsTsv(table));
writeFileSync(join(sampleDir, "heatmap.svg"), renderHeatmapSvg(base, candidate, { widths: AXIS_WIDTHS }));

console.log(`sample: ${FILES.length} files, ${ALL_WIDTHS.length} recorded widths, axis 20..160`);
console.log(`changed rows: ${table.length}`);
for (const row of table) console.log(`  ${row.file} ${row.from}->${row.to}: ${row.widths.join(",")}`);
