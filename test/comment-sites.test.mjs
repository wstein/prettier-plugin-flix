// Property test: a comment can be written at any token. Wherever it is, formatting must keep the
// program and the comment, and formatting the result again must change nothing.
//
// Every test source and fixture input is tried with a comment inserted at a token, in three forms
// (`// note` glued to a tight `.` or `::`, `/* note */` glued the same way, and `// own` on its
// own line before the token) and at three print widths (40, 60, 100). String literals are excluded,
// where a line break ends the string. By default every sixth site is checked, with the form and width
// rotating from site to site, which takes a few seconds; COMMENT_SITES_EVERY=1 checks every site in
// every form and width (a long run: use `npm run review:sweep -- sites` for the report).
//
// Failures that are known and not yet fixed are listed in known-comment-site-failures.json. A listed
// site is checked on every run and must keep failing in the listed way; once a fix makes it pass the
// test asks for the entry to be removed. Any other failure at a sampled site fails the test; a site
// outside the sample is only checked while it is listed, so removing an entry needs the full sweep
// (`npm run review:sweep -- sites`, also CI workflow Comment sites full sweep when the list changes).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { COMMENT_FORMS, fmt } from "./lib.mjs";
import { SITE_WIDTHS, describeNotRun, knownPlan, listedNotRun, mergePlans, parseKnown, planSites, reconcile, repoInputs, runSitePlan } from "../scripts/review-sweep-lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const every = Math.max(1, Number(process.env.COMMENT_SITES_EVERY ?? 6) || 6);
const known = parseKnown(readFileSync(join(here, "known-comment-site-failures.json"), "utf8"), "known-comment-site-failures.json");
const inputs = repoInputs(here);
const format = (text, width) => fmt(text, { printWidth: width });

for (const input of inputs) {
    test(`comment at any token: ${input.name}`, async () => {
        const plan = mergePlans(planSites(input.source, { every, forms: COMMENT_FORMS, widths: SITE_WIDTHS }), knownPlan(known, input.name));
        const { failures, checked } = await runSitePlan(format, input, plan);
        const mine = known.filter((e) => e.file === input.name);
        const { messages } = reconcile(mine, failures, checked);
        // A listed site that was not run (not planned, or its variant no longer parses) is never judged.
        const notRun = listedNotRun(mine, checked).map(describeNotRun);
        assert.deepEqual([...messages, ...notRun], [], `${messages.length + notRun.length} problems at ${checked.size} comment sites`);
    });
}

test("every known comment-site failure names an existing input", () => {
    const names = new Set(inputs.map((i) => i.name));
    const missing = known.filter((e) => !names.has(e.file)).map((e) => `${e.file} (issue ${e.issue})`);
    assert.deepEqual(missing, []);
});
