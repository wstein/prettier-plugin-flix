// Pair test: two comments at once, at random sites (`review:sweep sites` inserts only one). For every input
// (test/*.flix and fixtures) and a seeded random choice of two distinct comment sites, forms and a width, format
// twice and report the failures with the transition classes of the comment kinds (see comment-kinds.mjs).
// Usage: node scripts/comment-pairs.mjs [--pairs 5000] [--seed 1] [--widths 40,50,...] [--forms block,line,own] [--max 15]
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { format as prettierFormat } from "prettier";
import plugin from "../dist/index.js";
import { COMMENT_FORMS, commentSites, fingerprint, withCommentAt } from "../test/lib.mjs";
import { IDEMPOTENCE_WIDTHS, checkFormat, parseWidths, repoInputs } from "./review-sweep-lib.mjs";
import { analyze } from "./comment-kinds.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i < 0 ? d : args[i + 1]; };
const pairs = Number(opt("--pairs", 5000));
let seed = Number(opt("--seed", 1)) >>> 0;
const widths = parseWidths(opt("--widths"), IDEMPOTENCE_WIDTHS);
const forms = opt("--forms", COMMENT_FORMS.join(",")).split(",");
const max = Number(opt("--max", 15));
const rand = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (a) => a[Math.floor(rand() * a.length)];
const format = (t, w) => prettierFormat(t, { parser: "flix", plugins: [plugin], printWidth: w });

const inputs = repoInputs(join(root, "test")).map((i) => ({ ...i, sites: commentSites(i.source).map((s) => s.tokenIndex) })).filter((i) => i.sites.length > 1);
const failures = [];
const byClass = new Map();
let runs = 0;
let skipped = 0;
for (let n = 0; n < pairs; n++) {
    const input = pick(inputs);
    const a = pick(input.sites);
    let b = pick(input.sites);
    if (a === b) b = input.sites.find((s) => s !== a);
    const [early, late] = a < b ? [a, b] : [b, a];
    const formEarly = pick(forms);
    const formLate = pick(forms);
    const text = withCommentAt(withCommentAt(input.source, late, formLate), early, formEarly);
    if (fingerprint(text).errors.length) { skipped++; continue; }
    const before = fingerprint(text);
    for (const width of widths) {
        runs++;
        const r = await checkFormat(format, text, width, before);
        if (!r) continue;
        const entry = { file: input.name, width, early, late, formEarly, formLate, kind: r.kind, detail: r.detail };
        failures.push(entry);
        if (r.kind === "not-idempotent") {
            const t = await analyze(format, text, width);
            entry.classes = [...new Set((t.first ?? []).map((x) => `${x.from} -> ${x.to}`))].join(" | ") || "(none)";
            const key = entry.classes;
            const c = byClass.get(key) ?? { count: 0, example: { ...entry, input: text, pass1: r.output, pass2: r.second } };
            c.count++;
            byClass.set(key, c);
        }
    }
}
console.log(`pairs ${pairs} (${skipped} skipped: do not parse), runs ${runs}, failures ${failures.length}`);
for (const [k, v] of byClass) {
    console.log(`\n${v.count}x ${k}\n  e.g. ${v.example.file} width ${v.example.width} forms ${v.example.formEarly}+${v.example.formLate}`);
}
for (const f of failures.filter((f) => f.kind !== "not-idempotent").slice(0, max)) console.log(`${f.kind}: ${f.file} ${f.width} ${f.detail}`);
if (opt("--json")) (await import("node:fs")).writeFileSync(opt("--json"), JSON.stringify({ failures, classes: [...byClass] }, null, 1));
