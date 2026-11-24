// Fixtures for the opt-in Flix Datalog review-rules prototype (#209).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import {
    RULE_R1,
    RULE_R2,
    factsFromSweep,
    factsFromKnown,
    factsFromAudit,
    evaluateFindings,
    loadAndEvaluate,
    findingsFromExistingTooling,
    emitRunnerSource,
    escapeFindingField,
    unescapeFindingField,
    parseFindingLines,
    runFlixPrototype,
} from "../analysis/review-rules/lib.mjs";
import { main as reviewRulesMain } from "../analysis/review-rules/run.mjs";
import { parseKnown } from "../scripts/review-sweep-lib.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = join(root, "analysis/review-rules/fixtures");

test("R1: reports fails at width >= 40; exempts known, skips, and width < 40", () => {
    const sweep = JSON.parse(readFileSync(join(fixtures, "sweep-mixed.json"), "utf8"));
    const { fails, skips } = factsFromSweep(sweep);
    const known = factsFromKnown(parseKnown(readFileSync(join(fixtures, "known-except-wide-40.json"), "utf8")));
    const findings = evaluateFindings({ fails, skips, known, layouts: [], approvals: [] });
    assert.deepEqual(findings, [
        { rule: RULE_R1, subject: "wide.flix|60|plain|-", evidence: "width=60" },
    ]);
    // width 40 is excepted; width 20 and skipped are absent
    assert.equal(findings.some((f) => f.subject.includes("|20|")), false);
    assert.equal(findings.some((f) => f.subject.startsWith("skip.flix")), false);
    assert.equal(findings.some((f) => f.subject === "wide.flix|40|plain|-"), false);
});

test("R2: reports missing and stale digests; exempts matching approval", () => {
    const reviews = JSON.parse(readFileSync(join(fixtures, "reviews.json"), "utf8"));
    const { layouts, approvals, layoutChanges } = factsFromAudit(join(fixtures, "audit-layout"), reviews);
    const findings = evaluateFindings({ fails: [], skips: [], known: [], layouts, approvals });
    assert.deepEqual(
        findings.map((f) => f.subject).sort(),
        ["book.example.missing", "book.example.stale"],
    );
    assert.equal(findings.every((f) => f.rule === RULE_R2), true);
    assert.equal(findings.some((f) => f.subject === "book.example.approved"), false);

    const tooling = findingsFromExistingTooling({
        sweep: { cases: [] },
        knownIds: [],
        layoutChanges,
        reviews,
    });
    assert.deepEqual(tooling, findings);
});

test("R2: blank approval reason does not create an Approval fact", () => {
    const digest = "1111111111111111111111111111111111111111111111111111111111111111";
    const layoutChanges = [{ id: "book.example.blank-reason", digest, status: "layout-change" }];
    const reviews = {
        "book.example.blank-reason": { digest, reason: "   " },
    };
    const { layouts, approvals } = factsFromAudit({ layoutChanges, present: true }, reviews);
    assert.deepEqual(approvals, []);
    const findings = evaluateFindings({ fails: [], skips: [], known: [], layouts, approvals });
    assert.deepEqual(findings, [
        { rule: RULE_R2, subject: "book.example.blank-reason", evidence: digest },
    ]);
    assert.deepEqual(
        findings,
        findingsFromExistingTooling({ sweep: { cases: [] }, knownIds: [], layoutChanges, reviews }),
    );
});

test("loadAndEvaluate is deterministic and matches existing tooling", () => {
    const a = loadAndEvaluate({
        sweepPath: join(fixtures, "sweep-mixed.json"),
        knownPath: join(fixtures, "known-except-wide-40.json"),
        auditDir: join(fixtures, "audit-layout"),
        reviewsPath: join(fixtures, "reviews.json"),
    });
    const b = loadAndEvaluate({
        sweepPath: join(fixtures, "sweep-mixed.json"),
        knownPath: join(fixtures, "known-except-wide-40.json"),
        auditDir: join(fixtures, "audit-layout"),
        reviewsPath: join(fixtures, "reviews.json"),
    });
    assert.deepEqual(a.findings, b.findings);
    assert.deepEqual(
        a.findings,
        findingsFromExistingTooling({
            sweep: a.sweep,
            knownIds: a.facts.known,
            layoutChanges: a.layoutChanges,
            reviews: a.reviews,
        }),
    );
    assert.deepEqual(
        a.findings.map((f) => f.rule),
        [RULE_R1, RULE_R2, RULE_R2],
    );
});

test("emitRunnerSource embeds facts; parseFindingLines reads FINDING rows", () => {
    const src = emitRunnerSource({
        fails: [["a.flix|40|plain|-", 40]],
        skips: [],
        known: [],
        layouts: [["book.x", "deadbeef"]],
        approvals: [],
    });
    assert.match(src, /\bevaluate\(/);
    assert.match(src, /escapeFindingField/);
    assert.match(src, /"a\.flix\|40\|plain\|-"/);
    assert.deepEqual(
        parseFindingLines(`FINDING\t${RULE_R1}\ta.flix|40|plain|-\twidth=40\nnoise\n`),
        [{ rule: RULE_R1, subject: "a.flix|40|plain|-", evidence: "width=40" }],
    );
});

test("FINDING field escape round-trips tabs and newlines", () => {
    const subject = "tab\tname.flix|40|plain|-";
    const evidence = "width=40\nmore";
    const line = ["FINDING", escapeFindingField(RULE_R1), escapeFindingField(subject), escapeFindingField(evidence)].join("\t");
    assert.equal(line.split("\t").length, 4);
    assert.deepEqual(parseFindingLines(`${line}\n`), [
        { rule: RULE_R1, subject, evidence },
    ]);
    assert.equal(unescapeFindingField(escapeFindingField("a\\b\tc")), "a\\b\tc");
});

test("CLI writes findings JSON for the mixed fixtures", () => {
    const outDir = mkdtempSync(join(tmpdir(), "review-rules-"));
    const out = join(outDir, "findings.json");
    const code = reviewRulesMain([
        "--sweep", join(fixtures, "sweep-mixed.json"),
        "--known", join(fixtures, "known-except-wide-40.json"),
        "--audit", join(fixtures, "audit-layout"),
        "--reviews", join(fixtures, "reviews.json"),
        "--out", out,
        "--compare-tooling",
    ]);
    assert.equal(code, 0);
    const payload = JSON.parse(readFileSync(out, "utf8"));
    assert.equal(payload.matchesExistingTooling, true);
    assert.equal(payload.findings.length, 3);
});

test("optional Flix jar matches the Node mirror when FLIX_JAR is set", (t) => {
    if (!process.env.FLIX_JAR) {
        t.skip("FLIX_JAR unset — Flix prototype not exercised in CI");
        return;
    }
    const loaded = loadAndEvaluate({
        sweepPath: join(fixtures, "sweep-mixed.json"),
        knownPath: join(fixtures, "known-except-wide-40.json"),
        auditDir: join(fixtures, "audit-layout"),
        reviewsPath: join(fixtures, "reviews.json"),
    });
    const outDir = mkdtempSync(join(tmpdir(), "review-rules-flix-"));
    const flix = runFlixPrototype(loaded.facts, {
        jarPath: process.env.FLIX_JAR,
        outDir,
        rulesFile: join(root, "analysis/review-rules/ReviewRules.flix"),
    });
    assert.equal(flix.ok, true, flix.stderr || flix.stdout);
    assert.deepEqual(flix.findings, loaded.findings);
});

test("optional Flix jar round-trips a tab in the subject and blank-reason R2", (t) => {
    if (!process.env.FLIX_JAR) {
        t.skip("FLIX_JAR unset — Flix prototype not exercised in CI");
        return;
    }
    const tabId = "tab\tname.flix|40|plain|-";
    const digest = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const facts = {
        fails: [[tabId, 40]],
        skips: [],
        known: [],
        layouts: [["book.example.blank-reason", digest]],
        approvals: [],
    };
    const expected = evaluateFindings(facts);
    assert.deepEqual(expected.map((f) => f.subject).sort(), [
        "book.example.blank-reason",
        tabId,
    ]);
    const outDir = mkdtempSync(join(tmpdir(), "review-rules-flix-tab-"));
    const flix = runFlixPrototype(facts, {
        jarPath: process.env.FLIX_JAR,
        outDir,
        rulesFile: join(root, "analysis/review-rules/ReviewRules.flix"),
    });
    assert.equal(flix.ok, true, flix.stderr || flix.stdout);
    assert.deepEqual(flix.findings, expected);
});
