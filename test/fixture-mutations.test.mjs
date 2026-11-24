import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { loadFixture } from "./fixture.mjs";
import { fingerprint, fmt, programProblems } from "./lib.mjs";

const cases = [
    ["field-access arrow becomes a lambda", "comments/tight-arrow-line-comment", "s->//", "s-> //", /whitespace-sensitive token classes differ/],
    ["spaces split a package qualifier", "whitespace/package-qualifier", "Name::Very", "Name :: Very", /output does not parse/],
    ["spaces split a use-path qualifier", "expressions/cons-chain-spacing", "Foo::Bar", "Foo :: Bar", /output does not parse/],
    ["Datalog terminator loses required whitespace", "datalog/constraint-set", ". Edge", ".Edge", /Datalog constraint/],
    ["literal value changes", "datalog/constraint-set", "1, 2", "9, 2", /tokens differ/],
    ["a comment is deleted", "comments/tight-arrow-line-comment", "// keep", "", /comments differ/],
    ["leading operator comment is deleted", "comments/leading-operator-comments", "// Add the inputs.", "", /comments differ/],
    ["signature effect name changes", "declarations/signature-boundaries", "\\ Console", "\\ IO", /tokens differ/],
];

for (const [title, fixture, original, replacement, expected] of cases) {
    test(`fixture mutation: ${title}`, () => {
        const path = fileURLToPath(new URL(`./fixtures/${fixture}.md`, import.meta.url));
        const { input, outputs } = loadFixture(path);
        const before = fingerprint(input.code);
        const good = outputs[0].code;
        assert.deepEqual(before.errors, []);
        assert.deepEqual(programProblems(before, fingerprint(good)), []);
        const mutated = good.replace(original, replacement);
        assert.notEqual(mutated, good, "mutation must change the fixture");
        assert.match(programProblems(before, fingerprint(mutated)).join("\n"), expected);
    });
}

const tightTokenCases = [
    ["space after a method dot before a line comment", "def f(s: String): String = s.trim().// keep\n    toLowerCase()\n", ".//", ". //"],
    ["space after a method dot before a block comment", "def f(s: String): String = s.trim()./* keep */toLowerCase()\n", "./*", ". /*"],
    ["space beside a cons operator and block comments", "def f(): List[Int32] = 1/* a */::/* b */Nil\n", "*/::/*", "*/ ::/*"],
    ["space after a cons operator before a line comment", "def f(): List[Int32] = 1::// keep\n    Nil\n", ":://", ":: //"],
];

for (const [title, original, glued, spaced] of tightTokenCases) {
    test(`token-class mutation: ${title}`, () => {
        const tight = fingerprint(original);
        const loose = fingerprint(original.replace(glued, spaced));
        assert.deepEqual(tight.errors, []);
        assert.deepEqual(loose.errors, []);
        // Compare raw classes: list cons :: may loosen, but a glued comment still
        // changes the lexer class when space is inserted beside the operator.
        assert.deepEqual(programProblems(tight, loose, { terminators: false }), ["whitespace-sensitive token classes differ"], "adding space changes the token class");
        const gluedProblems = programProblems(loose, tight, { terminators: false });
        assert.ok(gluedProblems.includes("whitespace-sensitive token classes differ"), "gluing the comment changes the token class");
        if (title.includes("cons")) {
            assert.ok(gluedProblems.includes("cons :: tightened from spaced to tight"), "tightening a spaced cons is rejected");
        }
    });
}

const consPath = fileURLToPath(new URL("./fixtures/expressions/cons-chain-spacing.md", import.meta.url));

test("fixture mutation: leaving a fitting cons chain tight", async () => {
    const { input, outputs } = loadFixture(consPath);
    const options = outputs[0].options;
    const good = await fmt(input.code, options);
    assert.ok(good.includes("def tightFits(): List[Int32] = 1 :: 2 :: Nil"));
    const mutated = good.replace("def tightFits(): List[Int32] = 1 :: 2 :: Nil", "def tightFits(): List[Int32] = 1::2::Nil");
    assert.notEqual(mutated, good, "mutation must change the fixture");
    assert.equal(good, outputs[0].code);
});

test("fixture mutation: overlooking one spaced cons operator", async () => {
    const { input, outputs } = loadFixture(consPath);
    const options = outputs[0].options;
    const good = await fmt(input.code, options);
    assert.match(good, /def mixed\(\): List\[Int32\] = 1 :: 2 :: Nil/);
    const mutated = good.replace("def mixed(): List[Int32] = 1 :: 2 :: Nil", "def mixed(): List[Int32] = 1::2 :: Nil");
    assert.notEqual(mutated, good, "mutation must change the fixture");
    assert.equal(await fmt(input.code, options), good);
    assert.notEqual(await fmt(input.code, options), mutated);
});

test("program check: loosening a tight cons chain is accepted", () => {
    const before = fingerprint("def f(): List[Int32] = 1::2::Nil\n");
    const after = fingerprint("def f(): List[Int32] = 1 :: 2 :: Nil\n");
    assert.deepEqual(before.errors, []);
    assert.deepEqual(after.errors, []);
    assert.deepEqual(programProblems(before, after), []);
});

test("program check: tightening a spaced cons chain is rejected", () => {
    const before = fingerprint("def f(): List[Int32] = 1 :: 2 :: Nil\n");
    const after = fingerprint("def f(): List[Int32] = 1::2::Nil\n");
    assert.deepEqual(before.errors, []);
    assert.deepEqual(after.errors, []);
    assert.match(programProblems(before, after).join("\n"), /cons :: tightened from spaced to tight/);
});

test("program check: only parsed cons operators may change class", () => {
    const source = [
        "use pkg::Mod",
        "def f(): List[Int32] = 1::Nil",
        "def head(xs: List[Int32]): Int32 = match xs { case x::_ => x }",
    ].join("\n");
    const spaced = source.replace("1::Nil", "1 :: Nil").replace("x::_", "x :: _");
    for (const flixVersion of ["0.79.0", "0.80.0"]) {
        const before = fingerprint(source, flixVersion);
        const after = fingerprint(spaced, flixVersion);
        assert.deepEqual(before.errors, []);
        assert.deepEqual(after.errors, []);
        assert.deepEqual(before.programClasses, ["COLON_COLON_TIGHT", "ConsColonColon", "ConsColonColon"]);
        assert.deepEqual(programProblems(before, after), []);
        assert.match(programProblems(after, before).join("\n"), /cons :: tightened from spaced to tight/);

        // Isolate the class check from the parse error caused by an invalid use path.
        const qualifierMutation = {
            ...after,
            classes: ["COLON_COLON", ...after.classes.slice(1)],
            programClasses: ["COLON_COLON", ...after.programClasses.slice(1)],
        };
        assert.deepEqual(programProblems(before, qualifierMutation), ["whitespace-sensitive token classes differ"]);
    }
});
