// Fact mapping and a Node mirror of analysis/review-rules/ReviewRules.flix (#209).
// The Flix program is the readable prototype; this module keeps tests and the
// opt-in CLI working without a Flix jar, and compares against #206 tooling.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { caseId, parseResultDocument, readAuditLayoutChanges } from "../../scripts/sweep-results.mjs";
import { parseKnown } from "../../scripts/review-sweep-lib.mjs";
import { approvalFor } from "../../scripts/audit-flix-examples.mjs";

export const RULE_R1 = "R1-fail-without-exception";
export const RULE_R2 = "R2-layout-unapproved";
export const MIN_SUPPORTED_WIDTH = 40;

/** Escape a string for embedding in a Flix string literal. */
export function flixString(value) {
    return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
}

/** Build typed fact lists from a sweep export document. */
export function factsFromSweep(doc) {
    const fails = [];
    const skips = [];
    for (const c of doc.cases ?? []) {
        if (c.status === "fail") fails.push([c.id, Number(c.width)]);
        else if (c.status === "skipped") skips.push([c.id, Number(c.width)]);
    }
    fails.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] - b[1]));
    skips.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] - b[1]));
    return { fails, skips };
}

/** Known-failure entries → exception ids (same key as sweep case ids). */
export function factsFromKnown(entries) {
    const ids = (entries ?? []).map((e) =>
        caseId({ file: e.file, width: e.width, form: e.form, token: e.token }),
    );
    return [...new Set(ids)].sort();
}

/**
 * Layout changes from an audit report directory (or a pre-parsed
 * `{ layoutChanges }` bag) plus approvals from reviews.json.
 * Approval facts are created only when `approvalFor` accepts the review
 * (matching digest and non-blank reason), matching the audit helper.
 */
export function factsFromAudit(auditInput, reviews = {}) {
    const audit = typeof auditInput === "string"
        ? readAuditLayoutChanges(auditInput)
        : auditInput;
    const layoutChanges = audit.layoutChanges
        ?? (audit.cases ?? []).filter((c) => c.status === "layout-change").map((c) => ({
            id: c.case_name ?? c.id,
            digest: c.digest,
        }));
    const layouts = [];
    const approvals = [];
    for (const c of layoutChanges) {
        const id = c.id ?? c.case_name;
        layouts.push([id, c.digest]);
        // Match approvalFor: digest must match and reason must be a non-blank string.
        // Digest-only rows stay out of Approval so Datalog `not Approval(name, digest)` still fires.
        const reason = approvalFor({ status: "layout-change", digest: c.digest }, reviews[id]);
        if (reason) approvals.push([id, c.digest]);
    }
    layouts.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0));
    approvals.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0));
    return { layouts, approvals, layoutChanges, audit };
}

/**
 * Node mirror of ReviewRules.evaluate. Keep in lockstep with ReviewRules.flix.
 * Findings are sorted by (rule, subject, evidence).
 */
export function evaluateFindings({ fails, skips, known, layouts, approvals }) {
    void skips; // present for parity with Flix inject; skips never produce findings
    const knownSet = new Set(known);
    const approvalSet = new Set(approvals.map(([n, d]) => `${n}\0${d}`));
    const findings = [];
    for (const [id, width] of fails) {
        if (width >= MIN_SUPPORTED_WIDTH && !knownSet.has(id)) {
            findings.push({ rule: RULE_R1, subject: id, evidence: `width=${width}` });
        }
    }
    for (const [name, digest] of layouts) {
        if (!approvalSet.has(`${name}\0${digest}`)) {
            findings.push({ rule: RULE_R2, subject: name, evidence: digest });
        }
    }
    findings.sort((a, b) =>
        a.rule < b.rule ? -1 : a.rule > b.rule ? 1
            : a.subject < b.subject ? -1 : a.subject > b.subject ? 1
                : a.evidence < b.evidence ? -1 : a.evidence > b.evidence ? 1 : 0);
    return findings;
}

/** Load JSON inputs and return fact bags + Node findings. */
export function loadAndEvaluate({ sweepPath, knownPath, auditDir, reviewsPath }) {
    const sweep = parseResultDocument(JSON.parse(readFileSync(sweepPath, "utf8")), sweepPath);
    const { fails, skips } = factsFromSweep(sweep);
    const known = knownPath
        ? factsFromKnown(parseKnown(readFileSync(knownPath, "utf8"), knownPath))
        : [];
    const reviews = reviewsPath
        ? JSON.parse(readFileSync(reviewsPath, "utf8"))
        : {};
    const { layouts, approvals, layoutChanges, audit } = auditDir
        ? factsFromAudit(auditDir, reviews)
        : { layouts: [], approvals: [], layoutChanges: [], audit: { present: false } };

    const facts = { fails, skips, known, layouts, approvals };
    return {
        sweep,
        facts,
        findings: evaluateFindings(facts),
        layoutChanges,
        reviews,
        audit,
    };
}

/** Render a Flix list literal of tuples or strings. */
function flixList(items, renderItem) {
    if (items.length === 0) return "Nil";
    return `${items.map(renderItem).join(" :: ")} :: Nil`;
}

/**
 * Escape a field for the FINDING TSV line so embedded tabs/newlines round-trip.
 * Kept in sync with `escapeFindingField` in ReviewRules.flix.
 */
export function escapeFindingField(value) {
    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
}

/** Inverse of escapeFindingField. */
export function unescapeFindingField(value) {
    let out = "";
    for (let i = 0; i < value.length; i++) {
        if (value[i] === "\\" && i + 1 < value.length) {
            const n = value[++i];
            if (n === "n") out += "\n";
            else if (n === "r") out += "\r";
            else if (n === "t") out += "\t";
            else if (n === "\\") out += "\\";
            else out += `\\${n}`;
        } else out += value[i];
    }
    return out;
}

/**
 * Emit a self-contained Flix main that embeds the facts, runs evaluate,
 * and prints FINDING lines with escaped fields for the Node runner to parse.
 */
export function emitRunnerSource(facts) {
    const fails = flixList(facts.fails, ([id, w]) => `(${flixString(id)}, ${w})`);
    const skips = flixList(facts.skips, ([id, w]) => `(${flixString(id)}, ${w})`);
    const known = flixList(facts.known, (id) => flixString(id));
    const layouts = flixList(facts.layouts, ([n, d]) => `(${flixString(n)}, ${flixString(d)})`);
    const approvals = flixList(facts.approvals, ([n, d]) => `(${flixString(n)}, ${flixString(d)})`);
    return `/// Generated by analysis/review-rules/lib.mjs — do not edit by hand.
def main(): Unit \\ IO =
    let rows: List[(String, String, String)] = evaluate(
        ${fails},
        ${skips},
        ${known},
        ${layouts},
        ${approvals}
    );
    foreach ((rule, subject, evidence) <- rows)
        println("FINDING\\t\${escapeFindingField(rule)}\\t\${escapeFindingField(subject)}\\t\${escapeFindingField(evidence)}")
`;
}

/** Parse FINDING lines from Flix stdout (escaped TSV fields). */
export function parseFindingLines(text) {
    const out = [];
    for (const line of String(text).split(/\r?\n/)) {
        if (!line.startsWith("FINDING\t")) continue;
        const parts = line.split("\t");
        if (parts.length !== 4) continue;
        const [, rule, subject, evidence] = parts;
        out.push({
            rule: unescapeFindingField(rule),
            subject: unescapeFindingField(subject),
            evidence: unescapeFindingField(evidence),
        });
    }
    return out;
}

/**
 * Run the Flix prototype when FLIX_JAR (or jarPath) is set.
 * Compiles ReviewRules.flix + a generated Main beside outDir.
 */
export function runFlixPrototype(facts, { jarPath = process.env.FLIX_JAR, outDir, rulesFile }) {
    if (!jarPath) return { skipped: true, reason: "FLIX_JAR unset" };
    mkdirSync(outDir, { recursive: true });
    const mainPath = join(outDir, "Main.flix");
    writeFileSync(mainPath, emitRunnerSource(facts));
    const result = spawnSync(
        "java",
        ["-jar", jarPath, rulesFile, mainPath],
        { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
    );
    if (result.status !== 0) {
        return {
            skipped: false,
            ok: false,
            status: result.status,
            stderr: result.stderr,
            stdout: result.stdout,
        };
    }
    return {
        skipped: false,
        ok: true,
        findings: parseFindingLines(result.stdout),
        stdout: result.stdout,
    };
}

/** Equivalent check using existing #206 helpers (for comparison in tests). */
export function findingsFromExistingTooling({ sweep, knownIds, layoutChanges, reviews }) {
    const knownSet = new Set(knownIds);
    const findings = [];
    for (const c of sweep.cases ?? []) {
        if (c.status === "fail" && c.width >= MIN_SUPPORTED_WIDTH && !knownSet.has(c.id)) {
            findings.push({ rule: RULE_R1, subject: c.id, evidence: `width=${c.width}` });
        }
    }
    for (const c of layoutChanges ?? []) {
        const id = c.id ?? c.case_name;
        const ok = approvalFor({ status: "layout-change", digest: c.digest }, reviews[id]);
        if (!ok) findings.push({ rule: RULE_R2, subject: id, evidence: c.digest });
    }
    findings.sort((a, b) =>
        a.rule < b.rule ? -1 : a.rule > b.rule ? 1
            : a.subject < b.subject ? -1 : a.subject > b.subject ? 1
                : a.evidence < b.evidence ? -1 : a.evidence > b.evidence ? 1 : 0);
    return findings;
}

export function writeJson(path, value) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
