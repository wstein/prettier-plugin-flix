// Each known comment-site entry must still name a real site and keep failing in the listed way.
// Deleting an entry is still invisible to npm test (#162); run a full `review:sweep -- sites` before removals.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { COMMENT_FORMS, commentSites, fmt } from "./lib.mjs";
import { checkSite, parseKnown, repoInputs } from "../scripts/review-sweep-lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const known = parseKnown(readFileSync(join(here, "known-comment-site-failures.json"), "utf8"), "known-comment-site-failures.json");
const byName = new Map(repoInputs(here).map((i) => [i.name, i.source]));
const format = (text, width) => fmt(text, { printWidth: width });

for (const entry of known) {
    test(`known site still fails: ${entry.file} ${entry.form}@${entry.width} token ${entry.token} (${entry.issue})`, async () => {
        const source = byName.get(entry.file);
        assert.ok(source, `missing input ${entry.file}`);
        assert.ok(commentSites(source).some((s) => s.tokenIndex === entry.token), `token ${entry.token} is not a comment site in ${entry.file}`);
        assert.ok(COMMENT_FORMS.includes(entry.form), `unknown form ${entry.form}`);
        const r = await checkSite(format, source, entry.token, entry.form, entry.width);
        assert.equal(!!r.skipped, false, `listed site skipped (variant does not parse): token ${entry.token}`);
        assert.equal(r.kind, entry.kind, `expected ${entry.kind}, got ${r.kind}`);
    });
}
