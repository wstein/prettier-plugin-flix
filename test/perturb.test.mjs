// Property test: whatever the whitespace of a source looks like, formatting must keep the program
// and be stable. Each file is re-spaced with several fixed seeds, so failures are reproducible.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { findFixtures, loadFixture } from "./fixture.mjs";
import { fingerprint, fmt, perturbWhitespace, programProblems } from "./lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const SEEDS = [1, 2, 3, 4, 5];

const inputs = [];
for (const f of readdirSync(here).filter((f) => f.endsWith(".flix"))) inputs.push([f, readFileSync(join(here, f), "utf8")]);
for (const path of findFixtures(join(here, "fixtures"))) {
    const fx = loadFixture(path);
    if (fx.meta.status !== "error") inputs.push([path.slice(here.length + 1), fx.input.code]);
}

for (const [name, source] of inputs) {
    test(`re-spaced: ${name}`, async () => {
        assert.deepEqual(fingerprint(source).errors, [], "the input must parse");
        for (const seed of SEEDS) {
            const respaced = perturbWhitespace(source, seed);
            const label = `${name} seed ${seed}`;
            const before = fingerprint(respaced);
            assert.deepEqual(before.errors, [], `${label}: the re-spaced input must parse`);
            // The re-spaced text is the reference for the formatter, so it must first be the same
            // program as the original: tokens, comments, tree shape and every token whose class
            // (a->b versus a -> b, dot versus dot-then-whitespace) depends on adjacent characters.
            const original = fingerprint(source);
            assert.deepEqual(programProblems(original, before, { terminators: false }), [], `${label}: re-spacing must not change the program`);
            assert.deepEqual(before.classes, original.classes, `${label}: re-spacing must not change token classes`);
            const out = await fmt(respaced);
            assert.deepEqual(programProblems(before, fingerprint(out)), [], `${label}: the formatter must not change the program`);
            assert.equal(await fmt(out), out, `${label}: formatting the output again must change nothing`);
        }
    });
}
