// Runs every Markdown fixture under test/fixtures. UPDATE_FIXTURES=1 rewrites the Output blocks
// of `status: pass` fixtures with the formatter's actual output (review the diff afterwards).
import test from "node:test";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { dropTrailingCommas, fingerprint, fmt } from "./lib.mjs";
import { findFixtures, loadFixture, optionsFor, relativeTo, writeOutputs } from "./fixture.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const update = process.env.UPDATE_FIXTURES === "1";

/** The formatter must never change the program, whatever the layout looks like. */
function assertSameProgram(before, after, label) {
    assert.deepEqual(after.errors, [], `${label}: output must parse`);
    assert.deepEqual(dropTrailingCommas(after.tokens), dropTrailingCommas(before.tokens), `${label}: tokens`);
    assert.deepEqual(after.comments, before.comments, `${label}: comments`);
    assert.equal(after.shape, before.shape, `${label}: parse-tree shape`);
    assert.deepEqual(after.arrows, before.arrows, `${label}: arrow token classes`);
    assert.ok(after.constraintEnds.every((t) => t === "DOT_WS"), `${label}: Datalog constraints must end in a dot followed by whitespace, found ${after.constraintEnds}`);
}

for (const path of findFixtures(root)) {
    const name = relativeTo(root, path);
    const fixture = loadFixture(path, name);
    const { meta, input, outputs } = fixture;

    test(`${name}: ${meta.title}`, async () => {
        if (meta.status === "error") {
            await assert.rejects(fmt(input.code), (e) => {
                assert.ok(e instanceof SyntaxError, "expected a SyntaxError");
                if (meta.message) assert.match(e.message, new RegExp(meta.message));
                return true;
            });
            return;
        }

        const before = fingerprint(input.code);
        assert.deepEqual(before.errors, [], "the Input block must parse");
        const actual = [];
        for (const block of outputs) {
            const options = optionsFor(fixture, block);
            const out = await fmt(input.code, options);
            actual.push(out);
            const label = `${name} (${JSON.stringify(options)})`;
            assertSameProgram(before, fingerprint(out), label);
            assert.equal(await fmt(out, options), out, `${label}: formatting the output again must change nothing`);
        }

        if (meta.status === "todo") {
            // A known gap: the Output block is the desired result, which the formatter does not yet produce.
            outputs.forEach((block, i) =>
                assert.notEqual(actual[i], block.code, `${name}: now passes; set status: pass${meta.issue ? ` and close ${meta.issue}` : ""}`),
            );
            return;
        }
        if (update) {
            writeOutputs(path, fixture, actual);
            return;
        }
        outputs.forEach((block, i) => assert.equal(actual[i], block.code, `${name}: output block ${i + 1} (line ${block.line})`));
    });
}
