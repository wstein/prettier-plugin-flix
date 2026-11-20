// Usage: node scripts/check-corpus.mjs [--parse-exceptions=file.json] <dir-or-file>...
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fingerprint, fmt, programProblems } from "../test/lib.mjs";

const files = [];
const walk = (p) => {
    if (statSync(p).isDirectory()) { for (const e of readdirSync(p)) if (e !== "node_modules" && e !== ".git") walk(join(p, e)); }
    else if (p.endsWith(".flix")) files.push(p);
};
const args = process.argv.slice(2);
const exceptionsFile = args[0]?.startsWith("--parse-exceptions=") ? args.shift().slice("--parse-exceptions=".length) : null;
const parseExceptions = exceptionsFile === null ? null : JSON.parse(readFileSync(exceptionsFile, "utf8"));
args.forEach(walk);

let bad = 0, skipped = 0;
for (const f of files) {
    const t0 = Date.now();
    const src = readFileSync(f, "utf8");
    const a = fingerprint(src);
    if (a.errors.length) {
        const path = relative(process.cwd(), resolve(f)).split("\\").join("/");
        if (parseExceptions && !Object.hasOwn(parseExceptions, path)) {
            bad++;
            console.log(`FAIL ${f}: input does not parse: ${a.errors[0]}`);
        } else {
            skipped++;
            if (parseExceptions) console.log(`SKIP ${f}: ${parseExceptions[path]}`);
        }
        continue;
    }
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
