import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { loadFixture } from "./fixture.mjs";
import { fingerprint, programProblems } from "./lib.mjs";

const cases = [
    ["field-access arrow becomes a lambda", "comments/tight-arrow-line-comment", "s->//", "s-> //", /arrow token classes differ/],
    ["spaces split a package qualifier", "whitespace/package-qualifier", "Name::Very", "Name :: Very", /output does not parse/],
    ["Datalog terminator loses required whitespace", "datalog/constraint-set", ". Edge", ".Edge", /Datalog constraint/],
    ["literal value changes", "datalog/constraint-set", "1, 2", "9, 2", /tokens differ/],
    ["a comment is deleted", "comments/tight-arrow-line-comment", "// keep", "", /comments differ/],
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
