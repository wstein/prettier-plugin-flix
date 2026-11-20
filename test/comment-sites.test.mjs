// Property test: a line comment can be written after any token. Wherever it is, formatting must
// keep the program and the comment, and formatting the result again must change nothing.
//
// Every test source and fixture input is tried with a `// note` line comment inserted after each
// token in turn (string literals excluded, where a line break ends the string). By default every
// sixth site is checked, plus every tight dot and double colon with a glued comment.
// COMMENT_SITES_EVERY=1 checks all sites.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { findFixtures, loadFixture } from "./fixture.mjs";
import { commentSites, fingerprint, fmt, programProblems, withLineCommentAfter } from "./lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const every = Math.max(1, Number(process.env.COMMENT_SITES_EVERY ?? 6) || 6);

const inputs = [];
for (const f of readdirSync(here).filter((f) => f.endsWith(".flix"))) inputs.push([f, readFileSync(join(here, f), "utf8")]);
for (const path of findFixtures(join(here, "fixtures"))) {
    const fx = loadFixture(path);
    if (fx.meta.status !== "error") inputs.push([path.slice(here.length + 1), fx.input.code]);
}

for (const [name, source] of inputs) {
    test(`line comment after any token: ${name}`, async () => {
        const failures = [];
        let checked = 0;
        for (const site of commentSites(source).filter((site, i) => site.glued || i % every === 0)) {
            const variant = withLineCommentAfter(source, site);
            const before = fingerprint(variant);
            if (before.errors.length > 0) continue; // a comment in a place the grammar does not allow
            checked++;
            const at = variant.indexOf("// note");
            const where = JSON.stringify(variant.slice(Math.max(0, at - 30), at + 30));
            let out;
            try {
                out = await fmt(variant);
            } catch (e) {
                failures.push(`${where}: threw ${e.message.split("\n")[0]}`);
                continue;
            }
            const problems = programProblems(before, fingerprint(out));
            if (problems.length > 0) failures.push(`${where}: ${problems.join("; ")}`);
            else if ((await fmt(out)) !== out) failures.push(`${where}: not idempotent`);
        }
        assert.deepEqual(failures, [], `${failures.length} of ${checked} comment sites fail`);
    });
}
