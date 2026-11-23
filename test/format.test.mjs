import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fingerprint, fmt, programProblems } from "./lib.mjs";
import { loadFixture } from "./fixture.mjs";

const here = dirname(fileURLToPath(import.meta.url));

test("reports syntax errors with a location", async () => {
    await assert.rejects(fmt("def ("), (e) => e instanceof SyntaxError && e.loc.start.line === 1);
});

test("does not move a misplaced Flixdoc comment onto an enum case", async () => {
    const source = "enum Doc { /// Documentation.\n\n    case Yellow\n}\n";
    assert.equal(await fmt(source), "enum Doc { /// Documentation.\n    case Yellow\n}\n");
});

test("preserves access-dot token classes beside comments", async () => {
    const path = join(here, "fixtures", "whitespace", "tight-dot-comments.md");
    const { input } = loadFixture(path);
    const spaced = input.code.replace("./* keep */toLowerCase()", ". /* keep */toLowerCase()");
    const before = fingerprint(input.code);
    const spacedBefore = fingerprint(spaced);
    assert.ok(before.classes.every((token) => token === "DOT"));
    assert.ok(spacedBefore.classes.includes("DOT_WS"));

    for (const [source, original] of [[input.code, before], [spaced, spacedBefore]]) {
        assert.deepEqual(original.errors, []);
        for (const printWidth of [40, 100]) {
            const output = await fmt(source, { printWidth });
            assert.deepEqual(fingerprint(output).classes, original.classes);
            assert.equal(await fmt(output, { printWidth }), output);
        }
    }
});

// ---- corpus invariants: the formatter must never change the program ----

// Set FLIX_CORPUS to extra directories (path-delimited) to run the invariants over more sources.
const corpusDirs = [join(here, "."), ...(process.env.FLIX_CORPUS ?? "").split(":").filter(Boolean)];
const files = [];
const walk = (p) => {
    for (const e of readdirSync(p)) {
        const full = join(p, e);
        if (statSync(full).isDirectory()) walk(full);
        else if (e.endsWith(".flix") && statSync(full).size < 40_000) files.push(full);
    }
};
corpusDirs.forEach((d) => { try { walk(d); } catch { /* optional corpus */ } });

for (const f of files) {
    test(`invariants: ${f}`, async () => {
        const src = readFileSync(f, "utf8");
        const before = fingerprint(src);
        assert.deepEqual(before.errors, [], "fixture must parse");
        const out = await fmt(src);
        const after = fingerprint(out);
        assert.deepEqual(programProblems(before, after), [], "the formatter must not change the program");
        assert.equal(await fmt(out), out, "idempotent");
    });
}
