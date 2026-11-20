import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [reportPath, badgeDirectory] = process.argv.slice(2);
const report = readFileSync(reportPath, "utf8");
const totals = { LF: 0, LH: 0, BRF: 0, BRH: 0 };
for (const [, metric, value] of report.matchAll(/^(LF|LH|BRF|BRH):(\d+)$/gm)) {
    totals[metric] += Number(value);
}

const badges = [
    ["lines", totals.LH, totals.LF],
    ["branches", totals.BRH, totals.BRF],
];
mkdirSync(badgeDirectory, { recursive: true });
for (const [label, covered, total] of badges) {
    if (total === 0 || covered > total) throw new Error(`Invalid ${label} coverage totals`);
    const percentage = (100 * covered) / total;
    const badge = {
        schemaVersion: 1,
        label: `${label} covered`,
        message: `${percentage.toFixed(1)}%`,
        color: percentage >= 90 ? "brightgreen" : percentage >= 75 ? "yellowgreen" : "orange",
    };
    writeFileSync(join(badgeDirectory, `${label}.json`), `${JSON.stringify(badge)}\n`);
}
