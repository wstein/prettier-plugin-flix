// Pure helpers for the optional width heatmap: expand a width grid, build a
// changed-widths table, and draw a simple SVG when R/ggplot2 is not installed.
import { RESULT_SCHEMA_VERSION, caseId, parseResultDocument, sortCases, worstCaseStatus } from "../../scripts/sweep-results.mjs";

export const HEATMAP_STATUSES = ["pass", "fail", "skipped", "missing"];

/** Status colors for the SVG fallback (colorblind-friendly-ish). */
export const STATUS_COLORS = {
    pass: "#2ca02c",
    fail: "#d62728",
    skipped: "#ff7f0e",
    missing: "#c7c7c7",
};

/**
 * Expands base and candidate exports into long rows
 * `{ revision, label, file, width, status }` covering every width in `widths`.
 * Widths present in neither document become `missing`. A cell with several cases shows the worst
 * status (fail > skipped > pass, `CASE_STATUS_SEVERITY` in sweep-results.mjs).
 */
export function expandHeatmapRows(base, candidate, { widths } = {}) {
    const docs = [
        { role: "base", doc: parseResultDocument(base, "base") },
        { role: "candidate", doc: parseResultDocument(candidate, "candidate") },
    ];
    const widthSet = new Set(widths ?? []);
    if (!widths) {
        for (const { doc } of docs) for (const w of doc.config.widths ?? []) widthSet.add(w);
        for (const { doc } of docs) for (const c of doc.cases) widthSet.add(c.width);
    }
    const allWidths = [...widthSet].sort((a, b) => a - b);
    const files = new Set();
    for (const { doc } of docs) for (const c of doc.cases) files.add(c.file);
    const fileList = [...files].sort();

    const rows = [];
    for (const { role, doc } of docs) {
        const label = `${role}\n${doc.formatter.revision.slice(0, 12)}`;
        // One cell per file and width. A sites export has several cases per cell:
        // the cell shows the worst status among them.
        const byCell = new Map();
        for (const c of doc.cases) {
            const key = `${c.file}|${c.width}`;
            byCell.set(key, [...(byCell.get(key) ?? []), c.status]);
        }
        for (const file of fileList) {
            for (const width of allWidths) {
                const statuses = byCell.get(`${file}|${width}`);
                rows.push({
                    revision: doc.formatter.revision,
                    role,
                    label,
                    file,
                    width,
                    status: statuses ? worstCaseStatus(statuses) : "missing",
                });
            }
        }
    }
    return { rows, widths: allWidths, files: fileList, docs: docs.map((d) => d.doc) };
}

/**
 * Compact table of widths whose status changed between base and candidate.
 * Returns `{ file, from, to, widths: number[] }[]` sorted by file.
 */
export function changedWidthsTable(base, candidate) {
    const { rows, files } = expandHeatmapRows(base, candidate);
    const byFileWidth = new Map();
    for (const row of rows) {
        const key = `${row.file}|${row.width}`;
        const cur = byFileWidth.get(key) ?? { file: row.file, width: row.width };
        cur[row.role] = row.status;
        byFileWidth.set(key, cur);
    }
    const out = [];
    for (const file of files) {
        const groups = new Map(); // from>to -> widths
        for (const { width, base: b, candidate: c } of [...byFileWidth.values()].filter((r) => r.file === file)) {
            if (!b || !c || b === c) continue;
            const key = `${b}>${c}`;
            if (!groups.has(key)) groups.set(key, { file, from: b, to: c, widths: [] });
            groups.get(key).widths.push(width);
        }
        for (const g of groups.values()) {
            g.widths.sort((a, b) => a - b);
            out.push(g);
        }
    }
    return out.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : a.from < b.from ? -1 : 0));
}

/** TSV for the changed-widths table. */
export function formatChangedWidthsTsv(rows) {
    const lines = ["file\tfrom\tto\twidths"];
    for (const r of rows) lines.push([r.file, r.from, r.to, r.widths.join(",")].join("\t"));
    return `${lines.join("\n")}\n`;
}

/**
 * Minimal SVG heatmap (no R required). Facets are base | candidate panels.
 */
export function renderHeatmapSvg(base, candidate, { widths, cell = 8, labelWidth = 140 } = {}) {
    const { rows, widths: ws, files, docs } = expandHeatmapRows(base, candidate, { widths });
    const roles = ["base", "candidate"];
    const panelGap = 24;
    const header = 28;
    const legendH = 36;
    const panelW = labelWidth + ws.length * cell;
    const panelH = header + files.length * cell;
    const width = roles.length * panelW + (roles.length - 1) * panelGap + 16;
    const height = panelH + legendH + 16;
    const parts = [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">`,
        `<title>Width heatmap</title>`,
        `<rect width="100%" height="100%" fill="#ffffff"/>`,
    ];
    roles.forEach((role, pi) => {
        const ox = 8 + pi * (panelW + panelGap);
        const oy = 8;
        const doc = docs[pi];
        const title = `${role} · ${doc.formatter.revision.slice(0, 12)}`;
        parts.push(`<text x="${ox + labelWidth}" y="${oy + 16}" font-family="sans-serif" font-size="12">${escapeXml(title)}</text>`);
        files.forEach((file, fi) => {
            const y = oy + header + fi * cell;
            parts.push(`<text x="${ox + labelWidth - 4}" y="${y + cell - 1}" text-anchor="end" font-family="sans-serif" font-size="8">${escapeXml(file)}</text>`);
            ws.forEach((w, wi) => {
                const row = rows.find((r) => r.role === role && r.file === file && r.width === w);
                const status = row?.status ?? "missing";
                const x = ox + labelWidth + wi * cell;
                parts.push(`<rect x="${x}" y="${y}" width="${cell - 0.5}" height="${cell - 0.5}" fill="${STATUS_COLORS[status]}" data-status="${status}" data-file="${escapeXml(file)}" data-width="${w}"/>`);
            });
        });
        // width axis ticks every 10
        ws.forEach((w, wi) => {
            if (w % 10 !== 0 && wi !== 0 && wi !== ws.length - 1) return;
            const x = ox + labelWidth + wi * cell + cell / 2;
            parts.push(`<text x="${x}" y="${oy + header + files.length * cell + 10}" text-anchor="middle" font-family="sans-serif" font-size="7">${w}</text>`);
        });
    });
    // legend
    const ly = panelH + 12;
    HEATMAP_STATUSES.forEach((status, i) => {
        const x = 16 + i * 90;
        parts.push(`<rect x="${x}" y="${ly}" width="12" height="12" fill="${STATUS_COLORS[status]}"/>`);
        parts.push(`<text x="${x + 16}" y="${ly + 10}" font-family="sans-serif" font-size="10">${status}</text>`);
    });
    parts.push(`</svg>\n`);
    return parts.join("\n");
}

function escapeXml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Build a schema-v1 idempotence document from `{ file, width, status, kind?, reason? }[]`. */
export function buildIdempotenceGrid({ revision, cases, widths, createdAt }) {
    return {
        schemaVersion: RESULT_SCHEMA_VERSION,
        command: "idempotence",
        createdAt: createdAt ?? "2026-11-21T00:00:00.000Z",
        formatter: { revision, dirty: false },
        corpus: { revision, inputCount: new Set(cases.map((c) => c.file)).size },
        config: {
            widths: [...widths],
            every: null,
            shard: null,
            base: null,
            only: null,
            repo: true,
            seed: null,
        },
        cases: sortCases(
            cases.map((c) => ({
                id: caseId({ file: c.file, width: c.width }),
                file: c.file,
                width: c.width,
                status: c.status,
                ...(c.kind ? { kind: c.kind } : {}),
                ...(c.reason ? { reason: c.reason } : {}),
            })),
        ),
    };
}
