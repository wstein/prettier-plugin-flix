// Runs every Markdown fixture under test/fixtures. UPDATE_FIXTURES=1 rewrites the Output blocks
// of `status: pass` fixtures with the formatter's actual output (review the diff afterwards).
import test from "node:test";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fingerprint, fmt, programProblems } from "./lib.mjs";
import { findFixtures, loadFixture, optionsFor, relativeTo, writeOutputs } from "./fixture.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const update = process.env.UPDATE_FIXTURES === "1";

for (const path of findFixtures(root)) {
    const name = relativeTo(root, path);
    const fixture = loadFixture(path, name);
    const { meta, input, outputs } = fixture;

    test(`${name}: ${meta.title}`, async () => {
        if (meta.status === "error") {
            await assert.rejects(fmt(input.code, meta.options ?? {}), (e) => {
                assert.ok(e instanceof SyntaxError, "expected a SyntaxError");
                if (meta.message) assert.match(e.message, new RegExp(meta.message));
                return true;
            });
            return;
        }

        const actual = [];
        for (const block of outputs) {
            const options = optionsFor(fixture, block);
            const version = options.flixVersion;
            const before = fingerprint(input.code, version);
            assert.deepEqual(before.errors, [], "the Input block must parse");
            const out = await fmt(input.code, options);
            actual.push(out);
            const label = `${name} (${JSON.stringify(options)})`;
            assert.deepEqual(
                programProblems(before, fingerprint(out, version)),
                [],
                `${label}: the formatter must not change the program`,
            );
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
