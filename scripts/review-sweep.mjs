// Review sweeps: the checks a reviewer would otherwise rebuild by hand. Run `npm run review:sweep -- --help`.
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { format as prettierFormat } from "prettier";
import plugin from "../dist/index.js";
import { COMMENT_FORMS, fingerprint } from "../test/lib.mjs";
import {
    IDEMPOTENCE_WIDTHS,
    REGRESSION_WIDTHS,
    SITE_WIDTHS,
    checkFormat,
    describeNotRun,
    isPrivateOwnedDir,
    knownPlan,
    lineDiff,
    listedNotRun,
    loadInputs,
    mergePlans,
    minimize,
    parseKnown,
    parseSweepArgs,
    parseWidths,
    planSites,
    reconcile,
    renderHunks,
    repoInputs,
    requireInputs,
    runSitePlan,
    seconds,
    selectShard,
    sitesExitCode,
} from "./review-sweep-lib.mjs";
import { buildResultDocument, corpusFingerprint, makeCase } from "./sweep-results.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const testDir = join(root, "test");

const HELP = `Usage: npm run review:sweep -- <command> [options] [dir-or-file...]

Commands
  idempotence   Format every input at widths ${IDEMPOTENCE_WIDTHS.join(", ")} twice. Checks that the output parses, keeps tokens,
                comments, parse-tree shape and token classes, and is idempotent. Prints each failing
                file and width with the smallest input found and the first and second output as a diff.
  sites         Insert a comment at every token (forms: line "// note", block "/* note */", own line
                "// own") and format at widths ${SITE_WIDTHS.join(", ")}; same checks. --every N samples every Nth site
                (default 1, all sites; the test suite samples every 6th).
  regression    Format with the plugin built from --base <git-ref> and with the current build; print the
                number of differences per file and width, and the diff hunks. Always exits 0.
  all           idempotence, sites and regression in turn (regression needs --base).

Inputs
  The repository's own inputs are always used: test/*.flix and the inputs of test/fixtures.
  Extra directories or files are added from the arguments and from the environment variable
  FLIX_STDLIB_DIR (read only), for example the Flix standard library.

Options
  --known <file>    Known failures (JSON, see docs/development.md). Default: test/known-idempotence-failures.json
                    for idempotence and test/known-comment-site-failures.json for sites. A known failure must
                    keep failing; a failure not in the list and a listed failure that passes both exit 1.
  --every <N>       sites: check every Nth site (default 1)
  --widths <a,b>    override the widths of the command
  --base <git-ref>  regression: the base to compare with (built once into the system temporary directory)
  --only <text>     only inputs whose name contains <text>
  --shard <k/n>     only every n-th input, starting at the k-th (1-based): run shards in parallel processes
  --no-repo         skip the repository's own inputs, use only the extra paths
  --json <file>     write the failures (or the differences) as JSON (unchanged interface)
  --export <file>   write a versioned result document with one outcome per planned case (see docs/development.md)
  --seed <N>        record a seed in the export (sweeps themselves are deterministic without it)
  --max <N>         print at most N failures or hunks per command (default 40)
  --help            this text

Build first with npm run build: the sweeps run the plugin in dist/. Every command prints its run time.`;

const format = (text, width) => prettierFormat(text, { parser: "flix", plugins: [plugin], printWidth: width });

function gitRevision() {
    try {
        return execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    } catch {
        return "unknown";
    }
}

function gitDirty() {
    try {
        return execFileSync("git", ["-C", root, "status", "--porcelain"], { encoding: "utf8" }).trim().length > 0;
    } catch {
        return false;
    }
}

function gatherInputs(o) {
    const extra = [...o.paths, ...(process.env.FLIX_STDLIB_DIR ? [process.env.FLIX_STDLIB_DIR] : [])];
    const inputs = [...(o.repo ? repoInputs(testDir) : []), ...loadInputs(extra, { base: root })];
    const named = o.only ? inputs.filter((i) => i.name.includes(o.only)) : inputs;
    return selectShard(requireInputs(named), o.shard);
}

function writeExport(path, { command, widths, inputs, o, cases, baseSha }) {
    const doc = buildResultDocument({
        command,
        formatter: { revision: gitRevision(), dirty: gitDirty() },
        corpus: {
            revision: gitRevision(),
            inputCount: inputs.length,
            paths: o.paths,
            fingerprint: corpusFingerprint(inputs.map((i) => i.name)),
        },
        config: {
            widths,
            every: command === "sites" ? o.every : null,
            shard: o.shard ?? null,
            base: baseSha ?? o.base ?? null,
            only: o.only ?? null,
            repo: o.repo,
            seed: o.seed ?? null,
            known: o.known ?? null,
        },
        cases: cases.map((c) => makeCase(c)),
    });
    writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`);
    return `; exported ${path} (${doc.cases.length} cases)`;
}

function loadKnown(o, fallbackName) {
    const path = o.known ? resolve(o.known) : join(testDir, fallbackName);
    return existsSync(path) ? parseKnown(readFileSync(path, "utf8"), path) : [];
}

function report(title, { failures, messages, unknown, fixed, runs, skipped }, o) {
    console.log(`${title}: ${runs} runs, ${skipped} inputs or sites skipped (do not parse), ${failures.length} failures`);
    const byKind = {};
    for (const f of failures) byKind[`${f.kind}`] = (byKind[f.kind] ?? 0) + 1;
    if (failures.length > 0) console.log(`  by kind: ${Object.entries(byKind).map(([k, n]) => `${k} ${n}`).join(", ")}`);
    console.log(`  unknown failures: ${unknown.length}, known entries that pass now: ${fixed.length}`);
    for (const m of messages.slice(0, o.max)) console.log(`  ${m}`);
    if (messages.length > o.max) console.log(`  ... ${messages.length - o.max} more (use --max)`);
}

async function idempotence(o) {
    const started = Date.now();
    const widths = parseWidths(o.widths, IDEMPOTENCE_WIDTHS);
    const inputs = gatherInputs(o);
    const known = loadKnown(o, "known-idempotence-failures.json");
    const failures = [];
    const cases = [];
    const checked = new Set();
    let runs = 0;
    let skipped = 0;
    for (const input of inputs) {
        const before = fingerprint(input.source);
        if (before.errors.length > 0) {
            skipped++;
            for (const width of widths) {
                cases.push({ file: input.name, width, status: "skipped", reason: "input does not parse" });
            }
            continue;
        }
        for (const width of widths) {
            runs++;
            const r = await checkFormat(format, input.source, width, before);
            checked.add([input.name, width, "plain", "-"].join("|"));
            if (r) {
                failures.push({ file: input.name, width, kind: r.kind, detail: r.detail, source: input.source, output: r.output, second: r.second });
                cases.push({ file: input.name, width, status: "fail", kind: r.kind, reason: r.detail });
            } else {
                cases.push({ file: input.name, width, status: "pass" });
            }
        }
    }
    const { unknown, fixed, messages } = reconcile(known.filter((e) => inputs.some((i) => i.name === e.file)), failures, checked);
    report("idempotence", { failures, messages: [], unknown, fixed, runs, skipped }, o);
    // The smallest input and the first/second output diff, for every failure that is not known.
    for (const f of unknown.slice(0, o.max)) {
        const stillFails = async (text) => {
            const b = fingerprint(text);
            if (b.errors.length > 0) return false;
            const r = await checkFormat(format, text, f.width, b);
            return r !== null && r.kind === f.kind;
        };
        const small = await minimize(f.source, stillFails);
        const r = await checkFormat(format, small, f.width);
        console.log(`\n  ${f.file} width ${f.width}: ${f.kind} (${f.detail})\n  smallest input (${small.split("\n").length} lines):\n${indent(small)}`);
        if (r?.second !== undefined) console.log(`  first output -> second output:\n${indent(renderHunks(lineDiff(r.output, r.second)))}`);
        else if (r?.output) console.log(`  output:\n${indent(r.output)}`);
    }
    for (const m of messages.filter((m) => m.startsWith("known failure now passes"))) console.log(`  ${m}`);
    const written = o.json ? writeJson(o.json, failures.map(({ source, output, second, ...rest }) => rest)) : "";
    const exported = o.export ? writeExport(o.export, { command: "idempotence", widths, inputs, o, cases }) : "";
    console.log(`idempotence finished in ${seconds(Date.now() - started)}${written}${exported}`);
    return unknown.length + fixed.length > 0 ? 1 : 0;
}

async function sites(o) {
    const started = Date.now();
    const widths = parseWidths(o.widths, SITE_WIDTHS);
    const inputs = gatherInputs(o);
    const known = loadKnown(o, "known-comment-site-failures.json");
    const failures = [];
    const cases = [];
    const checked = new Set();
    let runs = 0;
    let skipped = 0;
    for (const input of inputs) {
        if (fingerprint(input.source).errors.length > 0) {
            for (const width of widths) {
                cases.push({ file: input.name, width, status: "skipped", reason: "input does not parse" });
            }
            continue;
        }
        const plan = mergePlans(planSites(input.source, { every: o.every, forms: COMMENT_FORMS, widths }), knownPlan(known, input.name));
        const r = await runSitePlan(format, input, plan);
        failures.push(...r.failures);
        cases.push(...r.cases);
        r.checked.forEach((k) => checked.add(k));
        runs += r.checked.size;
        skipped += r.skipped;
    }
    const names = new Set(inputs.map((i) => i.name));
    const { unknown, fixed, messages } = reconcile(known.filter((e) => names.has(e.file)), failures, checked);
    report("sites", { failures, messages, unknown, fixed, runs, skipped }, o);
    const unknownSet = new Set(unknown);
    const perFile = {};
    for (const f of failures) {
        const key = `${unknownSet.has(f) ? "UNKNOWN" : "known"}: ${f.file} ${f.form} ${f.kind}`;
        perFile[key] = (perFile[key] ?? 0) + 1;
    }
    for (const [key, n] of Object.entries(perFile).sort().slice(0, o.max)) console.log(`  ${n} x ${key}`);
    const notRun = listedNotRun(known.filter((e) => names.has(e.file)), checked);
    for (const e of notRun.slice(0, o.max)) console.log(`  ${describeNotRun(e)}`);
    const written = o.json ? writeJson(o.json, failures.map(({ input, output, second, ...rest }) => rest)) : "";
    const exported = o.export ? writeExport(o.export, { command: "sites", widths, inputs, o, cases }) : "";
    console.log(`sites finished in ${seconds(Date.now() - started)}${written}${exported}`);
    return sitesExitCode({ unknown, fixed, notRun });
}

/** Builds the plugin of `ref` in the system temporary directory (once per commit) and returns its directory. */
function buildBase(ref) {
    const sha = execFileSync("git", ["-C", root, "rev-parse", "--verify", `${ref}^{commit}`], { encoding: "utf8" }).trim();
    const dir = join(tmpdir(), `prettier-plugin-flix-sweep-${sha.slice(0, 12)}`);
    if (existsSync(dir)) {
        // A fixed name in a shared temporary directory: use it only when it is this user's private directory.
        const st = lstatSync(dir);
        if (!isPrivateOwnedDir(st)) throw new Error(`${dir} is not a private directory of this user; remove it or set TMPDIR`);
        if (existsSync(join(dir, "dist", "index.js"))) return { dir, sha };
        rmSync(dir, { recursive: true, force: true }); // an incomplete build
    }
    const work = mkdtempSync(join(tmpdir(), "prettier-plugin-flix-sweep-build-"));
    try {
        const archive = execFileSync("git", ["-C", root, "archive", "--format=tar", sha], { maxBuffer: 1 << 30 });
        execFileSync("tar", ["-x", "-C", work], { input: archive });
        const sameLock = readFileSync(join(work, "package-lock.json"), "utf8") === readFileSync(join(root, "package-lock.json"), "utf8");
        if (sameLock && existsSync(join(root, "node_modules"))) symlinkSync(join(root, "node_modules"), join(work, "node_modules"), "dir");
        else execFileSync("npm", ["ci"], { cwd: work, stdio: "inherit" }); // needs access to the grammar repository
        execFileSync("npm", ["run", "build"], { cwd: work, stdio: "inherit" });
        mkdirSync(dirname(dir), { recursive: true });
        execFileSync("mv", [work, dir]);
    } catch (e) {
        rmSync(work, { recursive: true, force: true });
        throw e;
    }
    return { dir, sha };
}

async function regression(o) {
    const started = Date.now();
    if (!o.base) throw new Error("regression needs --base <git-ref>");
    const widths = parseWidths(o.widths, REGRESSION_WIDTHS);
    const { dir, sha } = buildBase(o.base);
    const basePlugin = (await import(pathToFileURL(join(dir, "dist", "index.js")).href)).default;
    const baseFormat = (text, width) => prettierFormat(text, { parser: "flix", plugins: [basePlugin], printWidth: width });
    const inputs = gatherInputs(o);
    const safe = async (f, text, width) => {
        try {
            return await f(text, width);
        } catch (e) {
            return `THROW ${String(e.message).split("\n")[0]}\n`;
        }
    };
    const diffs = [];
    const cases = [];
    let runs = 0;
    for (const input of inputs) {
        for (const width of widths) {
            runs++;
            const a = await safe(baseFormat, input.source, width);
            const b = await safe(format, input.source, width);
            if (a !== b) {
                const hunks = lineDiff(a, b);
                diffs.push({ file: input.name, width, hunks });
                cases.push({ file: input.name, width, status: "fail", kind: "layout-differ", reason: `${hunks.length} hunks` });
            } else {
                cases.push({ file: input.name, width, status: "pass" });
            }
        }
    }
    console.log(`regression against ${o.base} (${sha.slice(0, 12)}): ${runs} runs at widths ${widths.join(", ")}, ${diffs.length} differ in ${new Set(diffs.map((d) => d.file)).size} files`);
    for (const d of diffs.slice(0, o.max)) console.log(`\n  ${d.file} width ${d.width}: ${d.hunks.length} hunks\n${indent(renderHunks(d.hunks, { limit: 5 }))}`);
    if (diffs.length > o.max) console.log(`  ... ${diffs.length - o.max} more differing runs (use --max)`);
    const written = o.json ? writeJson(o.json, diffs.map((d) => ({ file: d.file, width: d.width, hunks: d.hunks.length }))) : "";
    const exported = o.export ? writeExport(o.export, { command: "regression", widths, inputs, o, cases, baseSha: sha }) : "";
    console.log(`regression finished in ${seconds(Date.now() - started)}${written}${exported}`);
    return 0;
}

const indent = (text) => text.split("\n").map((l) => `    ${l}`).join("\n");

function writeJson(path, data) {
    writeFileSync(path, `${JSON.stringify(data, null, 1)}\n`);
    return `; wrote ${path}`;
}

async function main() {
    const o = parseSweepArgs(process.argv.slice(2));
    if (o.help || !o.command) {
        console.log(HELP);
        return o.help ? 0 : 2;
    }
    const commands = { idempotence, sites, regression };
    if (o.command === "all") {
        let code = 0;
        const started = Date.now();
        for (const name of ["idempotence", "sites", "regression"]) {
            if (name === "regression" && !o.base) {
                console.log("regression: not run (no --base)");
                continue;
            }
            code = Math.max(code, await commands[name](o));
            console.log("");
        }
        console.log(`all finished in ${seconds(Date.now() - started)}`);
        return code;
    }
    if (!commands[o.command]) throw new Error(`unknown command ${o.command} (use --help)`);
    return commands[o.command](o);
}

main().then(
    (code) => process.exit(code),
    (e) => {
        console.error(`review-sweep: ${e.message}`);
        process.exit(2);
    },
);
