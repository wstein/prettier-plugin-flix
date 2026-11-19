#!/usr/bin/env node
// Compiler oracle: the Flix compiler must say exactly the same about a formatted source file as
// about the original.
//
//   node scripts/oracle.mjs <flix.jar> <source-dir> [options]
//     --prelude <file>   compiled together with every file (default: <source-dir>/Prelude.flix)
//     --every <n>        only every n-th file (a reproducible sample; default 1 = all)
//     --jobs <n>         compilations in parallel (default: CPU count / 2)
//     --control          compare the original with a second unformatted run instead, to show
//                        the compiler is deterministic on this input
//     --pin <pin.json>   require the jar's SHA-256 to equal flix-spec's oracleArtifact digest
//
// Each file gets its own throwaway Flix project, as flix/flix does in its own test suite
// (compiling a whole directory at once fails: files redeclare the same modules, and the compiler
// resolves such conflicts in an order that is not stable even without formatting). Both versions
// are built with `flix build`; if that succeeds, `flix test` runs too. The normalized outputs must
// be identical: diagnostics by category, code and message (positions and snippets differ after
// formatting) or test results. Needs Java 21. Files that do not parse are left as they are.
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { cpus, tmpdir } from "node:os";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { format } from "prettier";
import plugin from "../dist/index.js";

const run = promisify(execFile);
const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); if (i < 0) return false; args.splice(i, 1); return true; };
const option = (name, dflt) => { const i = args.indexOf(name); if (i < 0) return dflt; const v = args[i + 1]; args.splice(i, 2); return v; };
const usage = "usage: oracle.mjs <flix.jar> <source-dir> [--prelude f] [--every n] [--jobs n] [--control] [--pin pin.json]";
const fail = (message) => { console.error(`${message}\n${usage}`); process.exit(2); };
/** A positive integer: "0", "1.5", "abc" and "" would otherwise make zero workers or an empty sample. */
const positiveInt = (name, raw) => {
    if (!/^[1-9]\d{0,8}$/.test(String(raw))) fail(`${name} must be a positive integer, got "${raw}"`);
    return Number(raw);
};
const control = flag("--control");
const pinFile = option("--pin", null);
const every = positiveInt("--every", option("--every", "1"));
const jobs = positiveInt("--jobs", option("--jobs", String(Math.max(1, Math.floor(cpus().length / 2)))));
const preludeOpt = option("--prelude", null);
const [jarArg, srcDir] = args;
if (!jarArg || !srcDir) fail("both <flix.jar> and <source-dir> are required");
// The compiler runs with a throwaway project as its working directory, so a relative jar path
// would no longer resolve there: use one absolute path for the digest check and for `java -jar`.
const jar = resolve(jarArg);
let jarBytes;
try { jarBytes = readFileSync(jar); } catch (e) { fail(`cannot read the jar ${jar}: ${e.message}`); }

if (pinFile) {
    const want = JSON.parse(readFileSync(pinFile, "utf8")).oracleArtifact.sha256;
    const got = createHash("sha256").update(jarBytes).digest("hex");
    if (got !== want) fail(`flix.jar digest ${got} does not match the pinned ${want}`);
}

const preludePath = preludeOpt ?? join(srcDir, "Prelude.flix");
let prelude = null;
try { prelude = readFileSync(preludePath, "utf8"); } catch { /* optional */ }
const files = readdirSync(srcDir).sort()
    .filter((f) => f.endsWith(".flix") && join(srcDir, f) !== preludePath && statSync(join(srcDir, f)).isFile())
    .filter((_, i) => i % every === 0);
if (files.length === 0) fail(`no .flix files selected from ${srcDir} (every ${every}); an empty sample would report success without compiling anything`);

const root = mkdtempSync(join(tmpdir(), "flix-oracle-"));
const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");
const flix = async (cwd, cmd) => {
    try {
        const r = await run("java", ["-jar", jar, cmd], { cwd, maxBuffer: 1 << 28, timeout: 10 * 60 * 1000 });
        return { status: 0, out: r.stdout + r.stderr };
    } catch (e) {
        return { status: e.code ?? 1, out: (e.stdout ?? "") + (e.stderr ?? "") + (e.killed ? "\nTIMEOUT" : "") };
    }
};

/** Positions and snippets differ after formatting; categories, codes, messages and test results must not. */
function normalize(proj, out) {
    return strip(out)
        .split(proj).join("<proj>")
        .split("\n")
        .filter((l) => /^-- |^>> |^Compilation failed|^\s*TEST|^Passed:/.test(l))
        .map((l) => l.replace(/\s+\d+(\.\d+)?\s*(ns|us|µs|ms|s)\s*$/, "").replace(/ Elapsed:.*$/, "").trim())
        .join("\n");
}

async function build(name, variant, text) {
    const dir = join(root, `${variant}-${name}`);
    mkdirSync(join(dir, "test"), { recursive: true });
    mkdirSync(join(dir, "src"), { recursive: true });
    writeFileSync(join(dir, "flix.toml"), '[package]\nversion = "0.1.0"\nflix = "0.80.0"\n');
    if (prelude !== null) writeFileSync(join(dir, "src", "Prelude.flix"), prelude);
    writeFileSync(join(dir, "test", name), text);
    let r = await flix(dir, "build");
    const stage = r.status === 0 ? "test" : "build";
    if (stage === "test") r = await flix(dir, "test");
    const text2 = normalize(dir, r.out);
    rmSync(dir, { recursive: true, force: true });
    if (text2 === "") throw new Error(`no recognizable compiler output for ${name} (${variant}, exit ${r.status}):\n${strip(r.out).slice(0, 1200)}`);
    return { stage, text: text2 };
}

const mismatches = [];
let unformatted = 0;
let done = 0;
const queue = [...files];
async function worker() {
    for (let name = queue.shift(); name !== undefined; name = queue.shift()) {
        const original = readFileSync(join(srcDir, name), "utf8");
        let second = original;
        if (!control) {
            try { second = await format(original, { parser: "flix", plugins: [plugin] }); } catch { unformatted++; }
        }
        const [a, b] = await Promise.all([build(name, "original", original), build(name, control ? "control" : "formatted", second)]);
        if (a.stage !== b.stage || a.text !== b.text) mismatches.push({ name, a, b, formatted: second });
        if (++done % 10 === 0) console.error(`  ${done}/${files.length}`);
    }
}

try {
    await Promise.all(Array.from({ length: jobs }, worker));
} catch (e) {
    console.error(e.message);
    process.exit(2);
}
console.log(`${files.length} files (every ${every}), ${jobs} jobs, ${unformatted} kept unformatted (do not parse)`);
if (mismatches.length > 0) {
    const keep = join(root, "mismatches");
    mkdirSync(keep, { recursive: true });
    for (const m of mismatches) {
        writeFileSync(join(keep, m.name + ".original.txt"), m.a.text);
        writeFileSync(join(keep, m.name + ".second.txt"), m.b.text);
        writeFileSync(join(keep, m.name + ".formatted.flix"), m.formatted);
        console.error(`MISMATCH ${m.name} (original: ${m.a.stage}, other: ${m.b.stage})`);
    }
    console.error(`${mismatches.length} of ${files.length} differ; details in ${keep}`);
    process.exit(1);
}
console.log("identical for every file");
rmSync(root, { recursive: true, force: true });
