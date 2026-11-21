import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { loadFixture } from "./fixture.mjs";
import { fingerprint, programProblems } from "./lib.mjs";

const cases = [
    ["field-access arrow becomes a lambda", "comments/tight-arrow-line-comment", "s->//", "s-> //", /whitespace-sensitive token classes differ/],
    ["spaces split a package qualifier", "whitespace/package-qualifier", "Name::Very", "Name :: Very", /output does not parse/],
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
        assert.deepEqual(programProblems(tight, loose), ["whitespace-sensitive token classes differ"], "adding space changes the token class");
        assert.deepEqual(programProblems(loose, tight), ["whitespace-sensitive token classes differ"], "gluing the comment changes the token class");
    });
}
