// Comment-kind report, library part: argument parsing and the run. The CLI is scripts/comment-kinds-report.mjs.
// Callers pass `format(text, width)` and the inputs `{ name, source }`.
import { writeFileSync } from "node:fs";
import { COMMENT_FORMS, fingerprint, withCommentAt } from "../test/lib.mjs";
import { IDEMPOTENCE_WIDTHS, SITE_WIDTHS, parsePositiveInt, parseWidths, planSites, seconds } from "./review-sweep-lib.mjs";
import { analyze } from "./comment-kinds.mjs";

/** Parses the CLI arguments. Throws on unknown options, missing values and invalid --widths or --every. */
export function parseKindsArgs(argv) {
    const o = { paths: [], every: 6, sites: false, repo: true };
    const takes = new Set(["--json", "--widths", "--every"]);
    let widths;
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === "--help" || a === "-h") o.help = true;
        else if (a === "--sites") o.sites = true;
        else if (a === "--no-repo") o.repo = false;
        else if (takes.has(a)) {
            if (i + 1 >= argv.length) throw new Error(`${a} needs a value`);
            const v = argv[++i];
            if (a === "--widths") widths = v;
            else if (a === "--every") o.every = parsePositiveInt("every", v);
            else o.json = v;
        } else if (a.startsWith("--")) throw new Error(`unknown option ${a}`);
        else o.paths.push(a);
    }
    o.widths = widths === undefined ? undefined : parseWidths(widths, undefined);
    return o;
}

/**
 * Formats every input at the widths (and, with `o.sites`, every sampled comment-site variant at the site widths),
 * counts the comment-kind transitions of both passes and prints them through `log`.
 * Returns 0, or 1 when a run is not idempotent.
 */
export async function runKindsReport(o, { format, inputs, log = console.log }) {
    const started = Date.now();
    const classes = new Map();
    let runs = 0;
    let bad = 0;
    const record = async (name, text, width) => {
        if (fingerprint(text).errors.length) return;
        runs++;
        const r = await analyze(format, text, width);
        if (!r.idempotent) bad++;
        for (const [phase, list] of [["pass1", r.first], ["pass2", r.second]]) {
            for (const t of list ?? []) {
                const key = `${phase} ${t.from} -> ${t.to}`;
                let e = classes.get(key);
                if (!e) classes.set(key, (e = { count: 0, idempotentFails: 0, example: { file: name, width, text: t.text, line: t.line } }));
                e.count++;
                if (!r.idempotent) e.idempotentFails++;
            }
        }
    };
    for (const input of inputs) {
        for (const width of o.widths ?? IDEMPOTENCE_WIDTHS) await record(input.name, input.source, width);
        if (o.sites) {
            for (const w of o.widths ?? SITE_WIDTHS) {
                for (const p of planSites(input.source, { every: o.every, forms: COMMENT_FORMS, widths: [w] })) {
                    await record(`${input.name}@site${p.token}/${p.form}`, withCommentAt(input.source, p.token, p.form), p.width);
                }
            }
        }
    }
    log(`runs ${runs}, not idempotent ${bad}`);
    for (const [k, v] of [...classes].sort((a, b) => b[1].count - a[1].count)) {
        log(`${String(v.count).padStart(6)}  (non-idempotent runs ${v.idempotentFails})  ${k}   e.g. ${v.example.file}@${v.example.width}:${v.example.line} ${JSON.stringify(v.example.text.slice(0, 30))}`);
    }
    if (o.json) writeFileSync(o.json, JSON.stringify([...classes], null, 1));
    log(`kinds finished in ${seconds(Date.now() - started)}${o.json ? `; wrote ${o.json}` : ""}`);
    return bad > 0 ? 1 : 0;
}
