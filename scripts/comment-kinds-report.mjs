// Usage: node scripts/comment-kinds-report.mjs [--json file] [--widths 40,80] [--sites] [paths...]
// Reports transition classes (from -> to) over the repository inputs (test/*.flix, fixtures), extra paths and,
// with --sites, comment-site variants (as `review:sweep sites`, sampled by --every).
import { writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { format as prettierFormat } from "prettier";
import plugin from "../dist/index.js";
import { COMMENT_FORMS, fingerprint } from "../test/lib.mjs";
import { loadInputs, parseWidths, planSites, repoInputs, SITE_WIDTHS, IDEMPOTENCE_WIDTHS } from "./review-sweep-lib.mjs";
import { analyze } from "./comment-kinds.mjs";
import { withCommentAt } from "../test/lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i < 0 ? undefined : args.splice(i, 2)[1]; };
const json = opt("--json");
const widthsArg = opt("--widths");
const every = Number(opt("--every") ?? 6);
const sites = args.includes("--sites");
const paths = args.filter((a) => !a.startsWith("--"));
const format = (t, w) => prettierFormat(t, { parser: "flix", plugins: [plugin], printWidth: w });

const inputs = [...repoInputs(join(root, "test")), ...loadInputs(paths, { base: root })];
const classes = new Map();
const note = (phase, t, ctx) => {
    const key = `${phase} ${t.from} -> ${t.to}`;
    let e = classes.get(key);
    if (!e) classes.set(key, (e = { count: 0, idempotentFails: 0, example: ctx }));
    e.count++;
    return e;
};
let runs = 0;
let bad = 0;
const record = async (name, text, width) => {
    if (fingerprint(text).errors.length) return;
    runs++;
    const r = await analyze(format, text, width);
    if (!r.idempotent) bad++;
    for (const [phase, list] of [["pass1", r.first], ["pass2", r.second]]) {
        for (const t of list ?? []) {
            const e = note(phase, t, { file: name, width, text: t.text, line: t.line });
            if (!r.idempotent) e.idempotentFails++;
        }
    }
};
for (const input of inputs) {
    for (const width of parseWidths(widthsArg, IDEMPOTENCE_WIDTHS)) await record(input.name, input.source, width);
    if (sites) {
        for (const w of parseWidths(widthsArg, SITE_WIDTHS)) {
            for (const p of planSites(input.source, { every, forms: COMMENT_FORMS, widths: [w] })) {
                await record(`${input.name}@site${p.token}/${p.form}`, withCommentAt(input.source, p.token, p.form), p.width);
            }
        }
    }
}
console.log(`runs ${runs}, not idempotent ${bad}`);
for (const [k, v] of [...classes].sort((a, b) => b[1].count - a[1].count)) {
    console.log(`${String(v.count).padStart(6)}  (non-idempotent runs ${v.idempotentFails})  ${k}   e.g. ${v.example.file}@${v.example.width}:${v.example.line} ${JSON.stringify(v.example.text.slice(0, 30))}`);
}
if (json) writeFileSync(json, JSON.stringify([...classes], null, 1));
