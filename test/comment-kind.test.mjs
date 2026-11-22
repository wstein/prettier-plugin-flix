// Comment kinds: the kind a comment has in the output (own line, line start, line end, inline; attached before or
// after a token) is the kind the next pass reads. The detector in scripts/comment-kinds.mjs names the kind of each
// comment and every change of kind between source, pass 1 and pass 2. These tests pin the detector and the three
// inputs where a block comment changes kind (inline to line start) and the second pass must still match the first.
import test from "node:test";
import assert from "node:assert/strict";
import { fmt } from "./lib.mjs";
import { analyze, commentKinds, transitions } from "../scripts/comment-kinds.mjs";

const CASE1 = `def f(x: Option[Int32]): Int32 = {let y = 1;
match x { /* note */ case Some(v) => v+y
case None => y}}
`;
const CASE2 = `pub def a(): Map[String, Int32] = Map#{
"batch"      =>2,
"export"=>1 // note
, /* c */ "sync"=>120 // Sync attempts are cheap.
}
`;
const RECORD = `pub def f(): {id = Int32, name = String, active = Bool} = {
id=7 // note
, /* Assigned */ name="Flix",
active=true // Active accounts can sign in.
}
`;
const format = (text, width) => fmt(text, { printWidth: width });
const WIDTHS = [20, 30, 40, 50, 60, 70, 80, 100, 120, 160];

for (const [name, source] of [["match arm after a leading block comment", CASE1], ["map entry after a leading block comment", CASE2], ["record field after a leading block comment", RECORD]]) {
    test(`idempotent at widths 20 to 160: ${name}`, async () => {
        for (const width of WIDTHS) {
            const first = await format(source, width);
            const second = await format(first, width);
            assert.equal(second, first, `width ${width}`);
        }
    });
}

test("detector reports a block comment that moves from inline to the start of a line", async () => {
    const r = await analyze(format, CASE1, 40);
    assert.deepEqual(r.first.map((t) => `${t.from} -> ${t.to}`), ["lead:inline -> lead:line-start"]);
});

test("detector names the kind of each comment", () => {
    const kinds = commentKinds("def f(): Int32 = {\n    // own\n    let x = 1; // end\n    x /* inline */ + 1\n}\n").map((k) => k.kind);
    assert.deepEqual(kinds, ["lead:own-line:line", "trail:line-end:line", "lead:inline"]);
});

test("detector names line start, line end, own line and inline block comments", () => {
    const kinds = (text) => commentKinds(text).map((k) => k.kind);
    assert.deepEqual(kinds("def f(): Int32 =\n/* a */ 1\n"), ["lead:line-start"]);
    assert.deepEqual(kinds("def f(): Int32 = 1 /* a */\n"), ["trail:line-end"]);
    assert.deepEqual(kinds("def f(): Int32 = {\n/* a */\n1\n}\n"), ["lead:own-line"]);
    assert.deepEqual(kinds("def f(): Int32 = 1 /* a */ + 2\n"), ["lead:inline"]);
});

test("transitions lists only changed kinds and refuses different comment sequences", () => {
    const a = commentKinds("def f(): Int32 = 1 /* a */ + 2\n");
    const b = commentKinds("def f(): Int32 = 1 /* a */\n    + 2\n");
    assert.deepEqual(transitions(a, a), []);
    assert.deepEqual(transitions(a, b).map((t) => `${t.from} -> ${t.to}`), ["lead:inline -> trail:line-end"]);
    assert.equal(transitions(a, commentKinds("def f(): Int32 = 1 /* b */ + 2\n")), null);
    assert.equal(transitions(a, []), null);
});

test("analyze reports the changes of pass 1 and of pass 2 separately", async () => {
    // A formatter that toggles the comment between the middle and the end of the line.
    const toggle = (text) => (text.includes("/* a */ +") ? text.replace("/* a */ +", "/* a */\n    +") : text.replace("/* a */\n    +", "/* a */ +"));
    const r = await analyze(toggle, "def f(): Int32 = 1 /* a */ + 2\n", 80);
    assert.equal(r.idempotent, false);
    assert.deepEqual(r.first.map((t) => `${t.from} -> ${t.to}`), ["lead:inline -> trail:line-end"]);
    assert.deepEqual(r.second.map((t) => `${t.from} -> ${t.to}`), ["trail:line-end -> lead:inline"]);
});

test("comments are listed in source order", () => {
    assert.deepEqual(commentKinds("def f(): Int32 = 1 /* a */ + /* b */ 2 // c\n").map((k) => k.text), ["/* a */", "/* b */", "// c"]);
    assert.deepEqual(commentKinds("def f(): Int32 = {\n// a\nlet x = 1; // b\n/* c */ x // d\n}\n").map((k) => k.text), ["// a", "// b", "/* c */", "// d"]);
});

// The report (scripts/comment-kinds-report-lib.mjs, scripts/comment-kinds-report.mjs).
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseKindsArgs, runKindsReport } from "../scripts/comment-kinds-report-lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPORT_INPUTS = [{ name: "c.flix", source: CASE1 }];
const run = async (argv, fmtFn = format, inputs = REPORT_INPUTS) => {
    const lines = [];
    const code = await runKindsReport(parseKindsArgs(argv), { format: fmtFn, inputs, log: (l) => lines.push(l) });
    return { code, lines };
};

test("report counts runs and the transition classes at the given widths", async () => {
    const { code, lines } = await run(["--widths", "40,80"]);
    assert.equal(code, 0);
    assert.equal(lines[0], "runs 2, not idempotent 0");
    assert.match(lines[1], /^ +2  \(non-idempotent runs 0\)  pass1 lead:inline -> lead:line-start   e\.g\. c\.flix@40:\d+ "\/\* note \*\/"$/);
    assert.match(lines.at(-1), /^kinds finished in [\d.]+ s$/);
});

test("report with --sites adds the comment-site variants, sampled by --every", async () => {
    const plain = await run(["--widths", "60"]);
    const sites = await run(["--widths", "60", "--sites"]);
    const sparse = await run(["--widths", "60", "--sites", "--every", "1000"]);
    const runs = (r) => Number(/^runs (\d+),/.exec(r.lines[0])[1]);
    assert.equal(runs(plain), 1);
    assert.ok(runs(sites) > runs(sparse) && runs(sparse) > runs(plain), `${runs(plain)} ${runs(sparse)} ${runs(sites)}`);
});

const runsOf = (r) => Number(/^runs (\d+),/.exec(r.lines[0])[1]);

test("report widths: eight by default for inputs, three for site variants, --widths for both", async () => {
    assert.equal(runsOf(await run([])), 8); // 40,50,60,70,80,100,120,160
    assert.equal(runsOf(await run(["--widths", "60"])), 1);
    assert.equal(runsOf(await run(["--widths", "60,80"])), 2);
    // 111 variants parse at each width; without --widths the variants use 40,60,100 and the inputs the eight widths.
    assert.equal(runsOf(await run(["--sites", "--every", "1", "--widths", "60"])), 1 + 111);
    assert.equal(runsOf(await run(["--sites", "--every", "1", "--widths", "60,80"])), 2 + 2 * 111);
    assert.equal(runsOf(await run(["--sites", "--every", "1"])), 8 + 3 * 111);
});

test("report lists the classes by count, highest first", async () => {
    const { lines } = await run(["--sites", "--every", "1", "--widths", "60"]);
    const counts = lines.slice(1, -1).map((l) => Number(/^ *(\d+) /.exec(l)[1]));
    assert.ok(counts.length >= 2, lines.join("\n"));
    assert.deepEqual(counts, [...counts].sort((a, b) => b - a));
    assert.ok(counts[0] > counts.at(-1));
});

test("report orders the classes by count, not by name", async () => {
    // The outputs differ from every source, so pass 2 leaves them alone. Three classes whose names sort A < B < C and whose counts are B 3, A 2, C 1: neither name order matches.
    const A = "def f(): Int32 = 1 /* a */ + 2\n"; // inline -> trail:line-end
    const B = "def f(): Int32 =\n/* a */ 1\n"; // line-start -> inline
    const C = "def f(): Int32 = 1 /* a */\n    + 2\n"; // line-end -> inline
    const outputs = new Map([[A, "def f(): Int32 = 1 /* a */\n  + 2\n"], [B, "def f(): Int32 = /* a */ 1\n"], [C, "def f(): Int32 = 1 /* a */  + 2\n"]]);
    const inputs = [[A, 2], [B, 3], [C, 1]].flatMap(([source, n]) => Array.from({ length: n }, (_, i) => ({ name: `${outputs.get(source).length}-${i}.flix`, source })));
    const { lines } = await run(["--widths", "60"], (text) => outputs.get(text) ?? text, inputs);
    const classes = lines.slice(1, -1).map((l) => /^ *(\d+)  \(non-idempotent runs \d+\)  (pass\d .+?)   e\.g\./.exec(l).slice(1));
    assert.deepEqual(classes, [
        ["3", "pass1 lead:line-start -> lead:inline"],
        ["2", "pass1 lead:inline -> trail:line-end"],
        ["1", "pass1 trail:line-end -> lead:inline"],
    ]);
});

test("report passes a formatter error on instead of counting it", async () => {
    await assert.rejects(runKindsReport(parseKindsArgs(["--widths", "60"]), { format: () => { throw new Error("boom"); }, inputs: REPORT_INPUTS, log: () => {} }), /boom/);
});

test("report counts runs that are not idempotent and exits 1", async () => {
    const toggle = (text) => (text.includes("/* a */\n") ? text.replace(/\/\* a \*\/\s+\+/, "/* a */ +") : text.replace(/\/\* a \*\/\s+\+/, "/* a */\n    +"));
    const { code, lines } = await run(["--widths", "80"], toggle, [{ name: "t.flix", source: "def f(): Int32 = 1 /* a */ + 2\n" }]);
    assert.equal(code, 1);
    assert.equal(lines[0], "runs 1, not idempotent 1");
    assert.ok(lines.some((l) => /\(non-idempotent runs 1\)  pass1 lead:inline -> trail:line-end/.test(l)));
    assert.ok(lines.some((l) => /\(non-idempotent runs 1\)  pass2 trail:line-end -> lead:inline/.test(l)), lines.join("\n"));
});

test("report skips inputs that do not parse", async () => {
    const { lines } = await run(["--widths", "60"], format, [{ name: "bad.flix", source: "def (((\n" }]);
    assert.equal(lines[0], "runs 0, not idempotent 0");
});

test("report arguments: defaults and errors", () => {
    const d = parseKindsArgs([]);
    assert.deepEqual([d.every, d.sites, d.widths, d.repo, d.help], [6, false, undefined, true, undefined]);
    assert.equal(parseKindsArgs(["-h"]).help, true);
    const o = parseKindsArgs(["--sites", "--every", "3", "--widths", "40,60", "--no-repo", "--json", "o.json", "p.flix", "--help"]);
    assert.deepEqual([o.every, o.sites, o.widths, o.repo, o.json, o.paths, o.help], [3, true, [40, 60], false, "o.json", ["p.flix"], true]);
    for (const [argv, re] of [[["--widths", "x"], /--widths expects/], [["--widths", "0"], /--widths expects/], [["--every", "0"], /--every expects/], [["--every", "x"], /--every expects/], [["--bogus"], /unknown option/], [["--json"], /needs a value/]]) {
        assert.throws(() => parseKindsArgs(argv), re, argv.join(" "));
    }
});

const kindsCli = (...args) => spawnSync(process.execPath, [join(root, "scripts", "comment-kinds-report.mjs"), ...args], { cwd: root, encoding: "utf8" });

test("report command line: --help prints usage only, bad usage exits 2, a run exits 0 and writes JSON", () => {
    const h = kindsCli("--help", "--widths", "x");
    assert.equal(h.status, 2); // the invalid value is reported even with --help
    const h2 = kindsCli("--help");
    assert.equal(h2.status, 0);
    assert.match(h2.stdout, /Usage: npm run review:kinds/);
    assert.doesNotMatch(h2.stdout, /^runs /m);
    for (const args of [["--widths", "0"], ["--every", "x"], ["--bogus"], ["--no-repo"], ["--no-repo", "no/such/path.flix"]]) {
        const r = kindsCli(...args);
        assert.equal(r.status, 2, args.join(" "));
        assert.match(r.stderr, /^comment-kinds-report: /);
    }
    const dir = mkdtempSync(join(root, "test", ".kinds-"));
    try {
        const file = join(dir, "in.flix");
        writeFileSync(file, CASE1);
        const json = join(dir, "out.json");
        const r = kindsCli("--no-repo", "--widths", "40", "--json", json, file);
        assert.equal(r.status, 0, r.stderr);
        assert.match(r.stdout, /^runs 1, not idempotent 0$/m);
        assert.equal(JSON.parse(readFileSync(json, "utf8"))[0][0], "pass1 lead:inline -> lead:line-start");
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});
