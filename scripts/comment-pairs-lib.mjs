// Pair and triple test, library part: the seeded plan of comment combinations, the variants and the run.
// A combination is a set of two or three distinct comment sites of one input, each with a comment form. The plan is
// a pure function of the inputs, the counts, the seed and the forms, so a failure can be reproduced from its
// printed seed. Callers pass `format(text, width)`; the CLI is scripts/comment-pairs.mjs.
import { COMMENT_FORMS, commentSites, fingerprint, withCommentAt } from "../test/lib.mjs";
import { writeFileSync } from "node:fs";
import { SITE_WIDTHS, checkFormat, parsePositiveInt, parseWidths, seconds } from "./review-sweep-lib.mjs";
import { analyze } from "./comment-kinds.mjs";

export const DEFAULT_PAIRS = 5000;
export const DEFAULT_TRIPLES = 3000;
export const DEFAULT_SEED = 1;
export const PAIR_WIDTHS = SITE_WIDTHS;

/** Deterministic generator (mulberry32): `() => number in [0, 1)`. */
export function makeRandom(seed) {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const pick = (rand, list) => list[Math.floor(rand() * list.length)];

/** `k` distinct elements of `list` (needs `list.length >= k`), in the order drawn. */
export function pickDistinct(rand, list, k) {
    if (list.length < k) throw new Error(`need ${k} distinct sites, have ${list.length}`);
    const chosen = [];
    while (chosen.length < k) {
        const c = pick(rand, list);
        if (!chosen.includes(c)) chosen.push(c);
    }
    return chosen;
}

/** Parses the CLI arguments of the pair test. Throws on unknown options and invalid values. */
export function parsePairArgs(argv) {
    const o = { pairs: DEFAULT_PAIRS, triples: DEFAULT_TRIPLES, seed: DEFAULT_SEED, forms: [...COMMENT_FORMS], max: 15, paths: [], repo: true };
    const takes = new Set(["--pairs", "--triples", "--seed", "--widths", "--forms", "--max", "--json", "--only"]);
    let widths;
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === "--help" || a === "-h") o.help = true;
        else if (a === "--no-repo") o.repo = false;
        else if (takes.has(a)) {
            if (i + 1 >= argv.length) throw new Error(`${a} needs a value`);
            const v = argv[++i];
            if (a === "--pairs" || a === "--triples") {
                const n = Number(v);
                if (!Number.isInteger(n) || n < 0) throw new Error(`${a} expects a non-negative integer: ${v}`);
                o[a.slice(2)] = n;
            } else if (a === "--seed") {
                const n = Number(v);
                if (!Number.isInteger(n) || n < 0 || n > 0xffffffff) throw new Error(`--seed expects an integer from 0 to 4294967295: ${v}`);
                o.seed = n;
            } else if (a === "--max") o.max = parsePositiveInt("max", v);
            else if (a === "--widths") widths = v;
            else if (a === "--forms") o.forms = v.split(",");
            else o[a.slice(2)] = v;
        } else if (a.startsWith("--")) throw new Error(`unknown option ${a}`);
        else o.paths.push(a);
    }
    const bad = o.forms.filter((f) => !COMMENT_FORMS.includes(f));
    if (bad.length > 0) throw new Error(`--forms expects ${COMMENT_FORMS.join(", ")}: ${bad.join(", ")}`);
    o.widths = parseWidths(widths, PAIR_WIDTHS);
    return o;
}

/** Inputs with their comment sites (token indexes, source order); inputs with fewer than `min` sites are dropped. */
export function withSites(inputs, min) {
    return inputs.map((i) => ({ ...i, sites: commentSites(i.source).map((s) => s.tokenIndex) })).filter((i) => i.sites.length >= min);
}

/**
 * The plan: `pairs` combinations of two and `triples` of three distinct sites, each as
 * `{ file, size, sites: [ascending token indexes], forms: [one per site] }`. Pairs and triples draw from separate
 * streams of the seed, so the pairs do not change with the number of triples.
 */
export function planCombinations(inputs, { pairs, triples, seed, forms }) {
    const plan = [];
    for (const [size, count, salt] of [[2, pairs, 0], [3, triples, 0x9e3779b9]]) {
        if (count === 0) continue;
        const pool = withSites(inputs, size);
        if (pool.length === 0) throw new Error(`no input has ${size} comment sites`);
        const rand = makeRandom((seed ^ salt) >>> 0);
        for (let n = 0; n < count; n++) {
            const input = pick(rand, pool);
            const sites = pickDistinct(rand, input.sites, size).sort((a, b) => a - b);
            plan.push({ file: input.name, size, sites, forms: sites.map(() => pick(rand, forms)) });
        }
    }
    return plan;
}

/** `source` with a comment of each form at each site. The latest site goes in first, so earlier token indexes stay valid. */
export function withComments(source, sites, forms) {
    let text = source;
    for (let i = sites.length - 1; i >= 0; i--) text = withCommentAt(text, sites[i], forms[i]);
    return text;
}

/**
 * Runs the plan at every width. Returns `{ runs, skipped, failures }`; a failure is
 * `{ file, width, size, sites, forms, kind, detail, classes? }`, where `classes` lists the comment-kind
 * transitions of pass 1 for a non-idempotent run.
 */
export async function runCombinations(format, inputs, plan, widths) {
    const sources = new Map(inputs.map((i) => [i.name, i.source]));
    const failures = [];
    let runs = 0;
    let skipped = 0;
    for (const c of plan) {
        const text = withComments(sources.get(c.file), c.sites, c.forms);
        const before = fingerprint(text);
        if (before.errors.length > 0) {
            skipped++;
            continue;
        }
        for (const width of widths) {
            runs++;
            const r = await checkFormat(format, text, width, before);
            if (!r) continue;
            const entry = { file: c.file, width, size: c.size, sites: c.sites, forms: c.forms, kind: r.kind, detail: r.detail };
            if (r.kind === "not-idempotent") {
                const t = await analyze(format, text, width);
                entry.classes = [...new Set((t.first ?? []).map((x) => `${x.from} -> ${x.to}`))].join(" | ") || "(none)";
            }
            failures.push(entry);
        }
    }
    return { runs, skipped, failures };
}

/** 0 when no run failed, else 1. */
export const pairsExitCode = ({ failures }) => (failures.length > 0 ? 1 : 0);

const describe = (f) => `${f.file} width=${f.width} tokens=${f.sites.join("+")} forms=${f.forms.join("+")}`;

/** The whole test for parsed options `o`: plan, run, report through `log`, JSON file. Returns the exit code. */
export async function runPairTest(o, { format, inputs, log = console.log }) {
    const started = Date.now();
    const plan = planCombinations(inputs, o);
    const r = await runCombinations(format, inputs, plan, o.widths);
    log(`pairs: ${o.pairs} pairs, ${o.triples} triples (seed ${o.seed}), widths ${o.widths.join(",")}: ${r.runs} runs, ${r.skipped} combinations skipped (do not parse), ${r.failures.length} failures`);
    const byKind = {};
    const byClass = new Map();
    for (const f of r.failures) {
        byKind[f.kind] = (byKind[f.kind] ?? 0) + 1;
        if (f.classes) byClass.set(f.classes, [...(byClass.get(f.classes) ?? []), f]);
    }
    if (r.failures.length > 0) log(`  by kind: ${Object.entries(byKind).map(([k, n]) => `${k} ${n}`).join(", ")}`);
    for (const [k, list] of byClass) log(`  ${list.length} x not-idempotent, kind changes ${k}; e.g. ${describe(list[0])}`);
    for (const f of r.failures.filter((f) => f.kind !== "not-idempotent").slice(0, o.max)) log(`  ${f.kind}: ${describe(f)} (${f.detail})`);
    if (o.json) writeFileSync(o.json, `${JSON.stringify(r.failures, null, 1)}\n`);
    log(`pairs finished in ${seconds(Date.now() - started)}${o.json ? `; wrote ${o.json}` : ""}`);
    return pairsExitCode(r);
}
