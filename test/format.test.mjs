import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fingerprint, fmt, programProblems } from "./lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));

test("reports syntax errors with a location", async () => {
    await assert.rejects(fmt("def ("), (e) => e instanceof SyntaxError && e.loc.start.line === 1);
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
