// Usage: node scripts/check-corpus.mjs <dir-or-file>...  — formats each .flix file and verifies it.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fingerprint, fmt, programProblems } from "../test/lib.mjs";

const files = [];
const walk = (p) => {
    if (statSync(p).isDirectory()) { for (const e of readdirSync(p)) if (e !== "node_modules" && e !== ".git") walk(join(p, e)); }
    else if (p.endsWith(".flix")) files.push(p);
};
process.argv.slice(2).forEach(walk);

let bad = 0, skipped = 0;
for (const f of files) {
    const t0 = Date.now();
    const src = readFileSync(f, "utf8");
    const a = fingerprint(src);
    if (a.errors.length) { skipped++; continue; }
    const problems = [];
    let out;
    try { out = await fmt(src); } catch (e) { problems.push("format threw: " + String(e.message).split("\n")[0]); }
    if (out !== undefined) {
        problems.push(...programProblems(a, fingerprint(out)));
        if (!problems.length) {
            const again = await fmt(out);
            if (again !== out) problems.push("not idempotent");
        }
    }
    if (process.env.TIMING) console.log(`${Date.now() - t0}ms ${f}`);
    if (problems.length) { bad++; console.log(`FAIL ${f}: ${problems.join("; ")}`); }
}
console.log(`${files.length} files, ${skipped} skipped (do not parse), ${bad} failing`);
process.exit(bad ? 1 : 0);
