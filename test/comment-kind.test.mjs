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
