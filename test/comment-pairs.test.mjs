// Pair and triple test (scripts/comment-pairs-lib.mjs, scripts/comment-pairs.mjs): the seeded plan, the variants,
// the run with formatters that break one property each, the argument checks and the command line.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { commentSites, fmt } from "./lib.mjs";
import {
    DEFAULT_PAIRS, DEFAULT_SEED, DEFAULT_TRIPLES, PAIR_WIDTHS,
    makeRandom, pairsExitCode, parsePairArgs, pickDistinct, planCombinations, runCombinations, runPairTest, withComments, withSites,
} from "../scripts/comment-pairs-lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = "def f(): Int32 = 1 + 2\n";
const TWO = "def g(): Int32 = 1\n"; // 7 sites
const sites = (text) => commentSites(text).map((s) => s.tokenIndex);
const INPUTS = [{ name: "a.flix", source: SRC }, { name: "b.flix", source: "pub def h(x: Int32): Int32 = x + 1 + 2\n" }];
const FORMS = ["line", "block", "own"];
const planOf = (o = {}) => planCombinations(INPUTS, { pairs: 20, triples: 20, seed: 7, forms: FORMS, ...o });
const real = (text, width) => fmt(text, { printWidth: width });

test("makeRandom is deterministic per seed, differs between seeds and stays in [0, 1)", () => {
    const draw = (seed) => { const r = makeRandom(seed); return Array.from({ length: 5 }, () => r()); };
    assert.deepEqual(draw(3), draw(3));
    assert.notDeepEqual(draw(3), draw(4));
    assert.ok(draw(3).every((x) => x >= 0 && x < 1));
});

test("pickDistinct returns distinct elements and refuses a list that is too short", () => {
    const r = makeRandom(1);
    for (let i = 0; i < 50; i++) assert.equal(new Set(pickDistinct(r, [1, 2, 3], 3)).size, 3);
    assert.throws(() => pickDistinct(r, [1, 2], 3), /need 3 distinct sites, have 2/);
});

test("parsePairArgs: defaults, values and errors", () => {
    const d = parsePairArgs([]);
    assert.deepEqual([d.pairs, d.triples, d.seed, d.widths, d.repo], [DEFAULT_PAIRS, DEFAULT_TRIPLES, DEFAULT_SEED, PAIR_WIDTHS, true]);
    const o = parsePairArgs(["--pairs", "4", "--triples", "0", "--seed", "9", "--widths", "40,50", "--forms", "line,own", "--only", "x", "--no-repo", "p.flix"]);
    assert.deepEqual([o.pairs, o.triples, o.seed, o.widths, o.forms, o.only, o.repo, o.paths], [4, 0, 9, [40, 50], ["line", "own"], "x", false, ["p.flix"]]);
    for (const [argv, re] of [
        [["--bogus"], /unknown option --bogus/],
        [["--seed"], /--seed needs a value/],
        [["--seed", "-1"], /--seed expects/],
        [["--seed", "1.5"], /--seed expects/],
        [["--seed", "4294967296"], /--seed expects/],
        [["--pairs", "-2"], /--pairs expects a non-negative integer/],
        [["--triples", "x"], /--triples expects a non-negative integer/],
        [["--forms", "line,nope"], /--forms expects .*nope/],
        [["--widths", "0"], /--widths expects/],
        [["--max", "0"], /--max expects/],
    ]) assert.throws(() => parsePairArgs(argv), re, argv.join(" "));
});

test("the plan is the same for the same seed and differs for another seed", () => {
    assert.deepEqual(planOf(), planOf());
    assert.notDeepEqual(planOf(), planOf({ seed: 8 }));
});

test("the plan has the requested numbers of pairs and triples with distinct ascending sites", () => {
    const plan = planOf({ pairs: 30, triples: 25 });
    assert.equal(plan.filter((c) => c.size === 2).length, 30);
    assert.equal(plan.filter((c) => c.size === 3).length, 25);
    for (const c of plan) {
        assert.equal(c.sites.length, c.size);
        assert.equal(c.forms.length, c.size);
        assert.deepEqual(c.sites, [...new Set(c.sites)].sort((a, b) => a - b));
        assert.ok(c.forms.every((f) => FORMS.includes(f)));
        const own = sites(INPUTS.find((i) => i.name === c.file).source);
        assert.ok(c.sites.every((s) => own.includes(s)));
    }
});

test("the plan uses every form and several inputs", () => {
    const plan = planOf({ pairs: 60, triples: 60 });
    assert.deepEqual([...new Set(plan.flatMap((c) => c.forms))].sort(), [...FORMS].sort());
    assert.equal(new Set(plan.map((c) => c.file)).size, 2);
    assert.deepEqual([...new Set(planOf({ forms: ["own"] }).flatMap((c) => c.forms))], ["own"]);
});

test("the pairs of the plan do not depend on the number of triples", () => {
    const pairsOnly = (p) => p.filter((c) => c.size === 2);
    assert.deepEqual(pairsOnly(planOf({ triples: 0 })), pairsOnly(planOf({ triples: 40 })));
    assert.notDeepEqual(planOf({ pairs: 0, triples: 20 }), planOf({ pairs: 0, triples: 20, seed: 8 }));
});

test("inputs with too few sites are left out, and an empty pool is an error", () => {
    assert.deepEqual(withSites([{ name: "x", source: TWO }, INPUTS[0]], 9).map((i) => i.name), ["a.flix"]);
    assert.throws(() => planCombinations([{ name: "x", source: "x y\n" }], { pairs: 0, triples: 1, seed: 1, forms: FORMS }), /no input has 3 comment sites/);
    assert.deepEqual(planCombinations(INPUTS, { pairs: 0, triples: 0, seed: 1, forms: FORMS }), []);
});

test("withComments puts each comment at its own site, latest site first", () => {
    const s = sites(SRC);
    assert.equal(withComments(SRC, [s[7], s[8], s[9]], ["block", "line", "own"]), "def f(): Int32 = 1 /* note */  + // note\n \n// own\n2\n");
    assert.equal(withComments(SRC, [s[7], s[9]], ["line", "line"]), "def f(): Int32 = 1 // note\n + 2 // note\n\n");
    assert.equal(withComments(SRC, [], []), SRC);
});

test("a run with the real formatter passes; runs are combinations times widths", async () => {
    const plan = planOf({ pairs: 6, triples: 4 });
    const r = await runCombinations(real, INPUTS, plan, [40, 80]);
    assert.equal(r.failures.length, 0);
    assert.equal(r.runs + 2 * r.skipped, 20);
    assert.ok(r.runs > 0);
    assert.equal(pairsExitCode(r), 0);
});

test("a formatter that drops comments is a program failure", async () => {
    const r = await runCombinations((t) => t.replace(/\/\*.*?\*\/|\/\/[^\n]*/g, ""), INPUTS, planOf({ pairs: 8, triples: 0, forms: ["line"] }), [60]);
    assert.ok(r.failures.length > 0);
    assert.ok(r.failures.every((f) => f.kind === "program" && f.size === 2 && f.width === 60));
    assert.equal(pairsExitCode(r), 1);
});

test("a formatter that throws is reported as throw, one that emits garbage as unparsable", async () => {
    const plan = planOf({ pairs: 3, triples: 0 });
    const t = await runCombinations(() => { throw new Error("boom"); }, INPUTS, plan, [60]);
    assert.ok(t.failures.length > 0 && t.failures.every((f) => f.kind === "throw" && /boom/.test(f.detail)));
    const u = await runCombinations(() => "def (((\n", INPUTS, plan, [60]);
    assert.ok(u.failures.length > 0 && u.failures.every((f) => f.kind === "unparsable"));
});

test("a formatter that is not idempotent is reported with the comment-kind transitions", async () => {
    const toggle = (text) => (text.includes("/* note */\n") ? text.replace(/\/\* note \*\/\s+\+/, "/* note */ +") : text.replace(/\/\* note \*\/\s+\+/, "/* note */\n    +"));
    const input = { name: "t.flix", source: "def f(): Int32 = 1 + 2 + 3\n" };
    const s = sites(input.source);
    const plan = [{ file: "t.flix", size: 2, sites: [s[7], s[9]], forms: ["block", "line"] }];
    const r = await runCombinations(toggle, [input], plan, [80]);
    assert.equal(r.failures.length, 1);
    assert.equal(r.failures[0].kind, "not-idempotent");
    assert.match(r.failures[0].classes, /lead:inline -> trail:line-end/);
    assert.deepEqual([r.failures[0].file, r.failures[0].width, r.failures[0].sites, r.failures[0].forms], ["t.flix", 80, [s[7], s[9]], ["block", "line"]]);
});

test("a combination that does not parse is skipped, not run", async () => {
    const plan = [{ file: "bad.flix", size: 2, sites: [0, 1], forms: ["line", "line"] }];
    const r = await runCombinations(real, [{ name: "bad.flix", source: "def (((\n" }], plan, [60, 80]);
    assert.deepEqual([r.runs, r.skipped, r.failures.length], [0, 1, 0]);
});

const cli = (...args) => spawnSync(process.execPath, [join(root, "scripts", "comment-pairs.mjs"), ...args], { cwd: root, encoding: "utf8" });

test("the command line passes on a small sample, is reproducible and writes the JSON file", () => {
    const a = cli("--pairs", "6", "--triples", "4", "--widths", "60", "--only", "01_declarations", "--seed", "5");
    const b = cli("--pairs", "6", "--triples", "4", "--widths", "60", "--only", "01_declarations", "--seed", "5");
    assert.equal(a.status, 0, a.stderr);
    assert.match(a.stdout, /^pairs: 6 pairs, 4 triples \(seed 5\), widths 60: \d+ runs, \d+ combinations skipped \(do not parse\), 0 failures$/m);
    assert.match(a.stdout, /pairs finished in [\d.]+ s/);
    const strip = (s) => s.replace(/finished in [\d.]+ s/, "");
    assert.equal(strip(a.stdout), strip(b.stdout));
    const dir = mkdtempSync(join(root, "test", ".pairs-json-"));
    try {
        const out = join(dir, "failures.json");
        const c = cli("--pairs", "2", "--triples", "0", "--widths", "60", "--only", "01_declarations", "--json", out);
        assert.equal(c.status, 0, c.stderr);
        assert.ok(existsSync(out));
        assert.deepEqual(JSON.parse(readFileSync(out, "utf8")), []);
        assert.match(c.stdout, /; wrote /);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});

test("the command line exits 2 on invalid usage and 0 for --help", () => {
    for (const args of [["--seed", "-3"], ["--bogus"], ["--only", "no-such-input-name"], ["--no-repo"]]) {
        const r = cli(...args);
        assert.equal(r.status, 2, args.join(" "));
        assert.match(r.stderr, /^comment-pairs: /);
    }
    const h = cli("--help");
    assert.equal(h.status, 0);
    assert.match(h.stdout, /Usage: npm run review:pairs/);
});

test("runPairTest reports a passing run with exit 0 and failures with exit 1", async () => {
    const lines = [];
    const o = { ...parsePairArgs(["--pairs", "6", "--triples", "3", "--widths", "60", "--seed", "2"]) };
    assert.equal(await runPairTest(o, { format: real, inputs: INPUTS, log: (l) => lines.push(l) }), 0);
    assert.match(lines[0], /^pairs: 6 pairs, 3 triples \(seed 2\), widths 60: \d+ runs, \d+ combinations skipped \(do not parse\), 0 failures$/);
    assert.match(lines.at(-1), /^pairs finished in [\d.]+ s$/);
    assert.equal(lines.some((l) => l.includes("by kind")), false);

    const bad = [];
    const drop = (t) => t.replace(/\/\*.*?\*\/|\/\/[^\n]*/g, "");
    assert.equal(await runPairTest({ ...o, max: 2 }, { format: drop, inputs: INPUTS, log: (l) => bad.push(l) }), 1);
    assert.match(bad[0], / [1-9]\d* failures$/);
    assert.match(bad[1], /^  by kind: program \d+$/);
    assert.equal(bad.filter((l) => l.startsWith("  program: a.flix") || l.startsWith("  program: b.flix")).length, 2);
});

test("runPairTest lists the comment-kind transitions of non-idempotent runs and writes the JSON file", async () => {
    const toggle = (text) => (text.includes("/* note */\n") ? text.replace(/\/\* note \*\/\s+\+/, "/* note */ +") : text.replace(/\/\* note \*\/\s+\+/, "/* note */\n    +"));
    const lines = [];
    const dir = mkdtempSync(join(root, "test", ".pairs-json-"));
    try {
        const json = join(dir, "f.json");
        const o = parsePairArgs(["--pairs", "40", "--triples", "0", "--forms", "block", "--widths", "80", "--json", json]);
        const code = await runPairTest(o, { format: toggle, inputs: [{ name: "t.flix", source: "def f(): Int32 = 1 + 2 + 3\n" }], log: (l) => lines.push(l) });
        assert.equal(code, 1);
        assert.ok(lines.some((l) => /^  \d+ x not-idempotent, kind changes lead:inline -> trail:line-end; e\.g\. t\.flix width=80 /.test(l)), lines.join("\n"));
        const written = JSON.parse(readFileSync(json, "utf8"));
        assert.ok(written.length > 0 && written.every((f) => f.kind === "not-idempotent" && f.file === "t.flix"));
        assert.match(lines.at(-1), new RegExp(`; wrote ${json.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});

test("pairs and triples draw from separate streams of the seed", () => {
    const many = Array.from({ length: 16 }, (_, i) => ({ name: `n${i}.flix`, source: SRC }));
    // With one shared stream the first input of the pairs and of the triples would be the same for every seed.
    const same = [1, 2, 3, 4, 5, 6].filter((seed) => {
        const plan = planCombinations(many, { pairs: 1, triples: 1, seed, forms: FORMS });
        return plan[0].file === plan[1].file;
    });
    assert.ok(same.length < 6, `first input equal for seeds ${same}`);
});

test("without triples no input needs three comment sites", () => {
    const plan = planCombinations([{ name: "x", source: "x y\n" }], { pairs: 3, triples: 0, seed: 1, forms: FORMS });
    assert.equal(plan.length, 3);
});
