// Property test: a line or block comment can be written after any token. Wherever it is,
// formatting must keep the program and the comment, and formatting the result again must
// change nothing.
//
// Every test source and fixture input is tried with `// note` and `/* note */` inserted after
// each token in turn (string literals excluded, where a line break ends the string). By default
// every sixth site is checked, plus every tight dot and double colon with a glued comment, at
// print widths 40 and 100. COMMENT_SITES_EVERY=1 checks all sites.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { findFixtures, loadFixture } from "./fixture.mjs";
import { commentSites, fingerprint, fmt, programProblems, withLineCommentAfter } from "./lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const every = Math.max(1, Number(process.env.COMMENT_SITES_EVERY ?? 6) || 6);
const widths = [40, 100];
const styles = ["line", "block"];

const inputs = [];
for (const f of readdirSync(here).filter((f) => f.endsWith(".flix"))) inputs.push([f, readFileSync(join(here, f), "utf8")]);
for (const path of findFixtures(join(here, "fixtures"))) {
    const fx = loadFixture(path);
    if (fx.meta.status !== "error") inputs.push([path.slice(here.length + 1), fx.input.code]);
}

for (const [name, source] of inputs) {
    test(`comment after any token: ${name}`, async () => {
        const failures = [];
        let checked = 0;
        for (const site of commentSites(source).filter((site, i) => site.glued || i % every === 0)) {
            for (const style of styles) {
                const variant = withLineCommentAfter(source, { ...site, style });
                const before = fingerprint(variant);
                if (before.errors.length > 0) continue; // a comment in a place the grammar does not allow
                const marker = style === "block" ? "/* note */" : "// note";
                const at = variant.indexOf(marker);
                const where = `${style}@${JSON.stringify(variant.slice(Math.max(0, at - 30), at + 30))}`;
                for (const printWidth of widths) {
                    checked++;
                    let out;
                    try {
                        out = await fmt(variant, { printWidth });
                    } catch (e) {
                        failures.push(`${where} w=${printWidth}: threw ${e.message.split("\n")[0]}`);
                        continue;
                    }
                    const problems = programProblems(before, fingerprint(out));
                    if (problems.length > 0) failures.push(`${where} w=${printWidth}: ${problems.join("; ")}`);
                    else if ((await fmt(out, { printWidth })) !== out) {
                        failures.push(`${where} w=${printWidth}: not idempotent`);
                    }
                }
            }
        }
        assert.deepEqual(failures, [], `${failures.length} of ${checked} comment sites fail`);
    });
}
