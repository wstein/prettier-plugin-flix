// Versioned sweep result documents: export, shard merge, like-for-like compare, and
// the Markdown review summary used in GitHub Actions. Kept separate from the sweep
// runners so other tools (R heatmaps, DuckDB) can depend on a stable schema.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Bump when the document shape changes in a way that breaks consumers. */
export const RESULT_SCHEMA_VERSION = 1;

export const CASE_STATUSES = ["pass", "fail", "skipped"];

/** Stable case id shared with known-failure entry keys (`file|width|form|token`). */
export function caseId({ file, width, form = "plain", token = "-" }) {
    return [file, width, form ?? "plain", token ?? "-"].join("|");
}

/** Builds one case record. `reason` is required for skipped and recommended for fail. */
export function makeCase({ file, width, form, token, status, kind, reason }) {
    if (!CASE_STATUSES.includes(status)) throw new Error(`unknown case status: ${status}`);
    const id = caseId({ file, width, form, token });
    return {
        id,
        file,
        width,
        ...(form !== undefined ? { form } : {}),
        ...(token !== undefined ? { token } : {}),
        status,
        ...(kind !== undefined && kind !== null ? { kind } : {}),
        ...(reason !== undefined && reason !== null ? { reason } : {}),
    };
}

/**
 * A versioned result document. `cases` lists every planned outcome (pass, fail, skipped).
 * `config.shard` is set for a partial run; merged documents clear it.
 */
export function buildResultDocument({
    command,
    formatter,
    corpus,
    config,
    cases,
    createdAt = new Date().toISOString(),
}) {
    if (!command) throw new Error("result document needs a command");
    if (!formatter?.revision) throw new Error("result document needs formatter.revision");
    if (!Array.isArray(cases)) throw new Error("result document needs a cases array");
    return {
        schemaVersion: RESULT_SCHEMA_VERSION,
        command,
        createdAt,
        formatter: {
            revision: formatter.revision,
            ...(formatter.dirty !== undefined ? { dirty: Boolean(formatter.dirty) } : {}),
        },
        corpus: {
            // Plugin checkout that produced the run when the corpus is the repo itself;
            // with external paths the fingerprint identifies the input set.
            revision: corpus?.revision ?? formatter.revision,
            inputCount: corpus?.inputCount ?? 0,
            ...(corpus?.paths ? { paths: [...corpus.paths] } : {}),
            ...(corpus?.fingerprint ? { fingerprint: corpus.fingerprint } : {}),
        },
        config: {
            widths: [...(config?.widths ?? [])],
            every: config?.every ?? null,
            shard: config?.shard ?? null,
            base: config?.base ?? null,
            only: config?.only ?? null,
            repo: config?.repo !== false,
            seed: config?.seed ?? null,
            ...(config?.known ? { known: config.known } : {}),
        },
        cases: sortCases(cases),
    };
}

/** Deterministic order so identical inputs yield identical classification and order. */
export function sortCases(cases) {
    return [...cases].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** Fingerprint of the input names in a run (stable across shard merges of the same corpus). */
export function corpusFingerprint(names) {
    const hash = createHash("sha256");
    for (const name of [...names].sort()) {
        hash.update(name);
        hash.update("\0");
    }
    return hash.digest("hex");
}

/** Parses and validates a result document from JSON text or an object. */
export function parseResultDocument(input, where = "sweep result") {
    const doc = typeof input === "string" ? JSON.parse(input) : input;
    if (!doc || typeof doc !== "object") throw new Error(`${where}: expected an object`);
    if (doc.schemaVersion !== RESULT_SCHEMA_VERSION) {
        throw new Error(`${where}: unsupported schemaVersion ${doc.schemaVersion} (need ${RESULT_SCHEMA_VERSION})`);
    }
    if (!doc.command || !doc.formatter?.revision || !Array.isArray(doc.cases)) {
        throw new Error(`${where}: missing command, formatter.revision, or cases`);
    }
    for (const c of doc.cases) {
        if (!c?.id || !CASE_STATUSES.includes(c.status)) {
            throw new Error(`${where}: invalid case ${JSON.stringify(c)}`);
        }
    }
    return doc;
}

/** Parses `k/n` shard specs. Returns null when unset. */
export function parseShardSpec(shard) {
    if (shard == null || shard === "") return null;
    const m = /^(\d+)\/(\d+)$/.exec(String(shard));
    if (!m || Number(m[1]) < 1 || Number(m[1]) > Number(m[2])) {
        throw new Error(`invalid shard spec: ${shard}`);
    }
    return { k: Number(m[1]), n: Number(m[2]) };
}

/**
 * Config fields that must match for a like-for-like comparison or shard merge.
 * Full compares include shard (null when merged) and corpus fingerprint so a
 * partial shard set cannot look compatible with a full run. Shard merges ignore
 * per-shard fingerprints (recomputed from the union) and the shard field itself.
 */
export function configKey(doc, { ignoreShard = false, ignoreFingerprint = false } = {}) {
    const c = doc.config ?? {};
    const paths = [...(doc.corpus?.paths ?? c.paths ?? [])].map(String).sort();
    return JSON.stringify({
        command: doc.command,
        widths: c.widths ?? [],
        every: c.every ?? null,
        base: c.base ?? null,
        only: c.only ?? null,
        repo: c.repo !== false,
        seed: c.seed ?? null,
        known: c.known ?? null,
        paths,
        fingerprint: ignoreFingerprint ? null : (doc.corpus?.fingerprint ?? null),
        ...(ignoreShard ? {} : { shard: c.shard ?? null }),
    });
}

/**
 * Merges shard exports of one logical run. Requires a complete `1/n`…`n/n` set.
 * Cases are unioned by id; duplicate ids must agree. The merged document has
 * `config.shard: null`, `inputCount` = sum of shard input counts, and a fingerprint
 * over the union of case file names (same as an unsharded run of those inputs).
 */
export function mergeShardResults(docs) {
    if (!Array.isArray(docs) || docs.length === 0) throw new Error("merge needs at least one result document");
    const parsed = docs.map((d, i) => parseResultDocument(d, `shard ${i + 1}`));
    const key = configKey(parsed[0], { ignoreShard: true, ignoreFingerprint: true });
    for (let i = 1; i < parsed.length; i++) {
        if (configKey(parsed[i], { ignoreShard: true, ignoreFingerprint: true }) !== key) {
            throw new Error(`incompatible shard config: shard 1 vs shard ${i + 1}`);
        }
        if (parsed[i].formatter.revision !== parsed[0].formatter.revision) {
            throw new Error(`incompatible formatter revision across shards`);
        }
    }
    const specs = parsed.map((d, i) => {
        const spec = parseShardSpec(d.config?.shard);
        if (!spec) throw new Error(`shard ${i + 1}: merge requires config.shard k/n (got ${d.config?.shard})`);
        return spec;
    });
    const n = specs[0].n;
    if (specs.some((s) => s.n !== n)) throw new Error("incompatible shard denominators");
    if (parsed.length !== n) throw new Error(`incomplete shard set: got ${parsed.length} of ${n}`);
    const seen = new Set();
    for (const s of specs) {
        if (seen.has(s.k)) throw new Error(`duplicate shard ${s.k}/${n}`);
        seen.add(s.k);
    }
    for (let k = 1; k <= n; k++) {
        if (!seen.has(k)) throw new Error(`missing shard ${k}/${n}`);
    }

    const byId = new Map();
    for (const doc of parsed) {
        for (const c of doc.cases) {
            const prev = byId.get(c.id);
            if (prev && JSON.stringify(prev) !== JSON.stringify(c)) {
                throw new Error(`conflicting case ${c.id} across shards`);
            }
            byId.set(c.id, c);
        }
    }
    const files = [...new Set([...byId.values()].map((c) => c.file))].sort();
    const inputCount = parsed.reduce((sum, d) => sum + (d.corpus?.inputCount ?? 0), 0);
    return buildResultDocument({
        command: parsed[0].command,
        formatter: parsed[0].formatter,
        corpus: {
            revision: parsed[0].corpus.revision,
            inputCount,
            ...(parsed[0].corpus.paths ? { paths: parsed[0].corpus.paths } : {}),
            fingerprint: corpusFingerprint(files),
        },
        config: { ...parsed[0].config, shard: null },
        cases: [...byId.values()],
        createdAt: parsed.map((d) => d.createdAt).sort().at(-1),
    });
}

function outcomeMap(doc) {
    const map = new Map();
    for (const c of doc.cases) map.set(c.id, c);
    return map;
}

function isFail(c) {
    return c?.status === "fail";
}

/**
 * Compares two like-for-like sweep exports.
 * Returns classifications with stable sort order, plus flags for absent/incomplete/incompatible runs.
 * A base failure whose id is missing from the candidate (or only skipped there) is incomplete, not a fix.
 */
export function compareSweepResults(base, candidate) {
    const empty = {
        compatible: false,
        incomplete: true,
        reason: "absent",
        newFailures: [],
        fixedFailures: [],
        ongoingFailures: [],
        skipped: [],
        missingFromCandidate: [],
        counts: { cases: 0, pass: 0, fail: 0, skipped: 0 },
    };
    if (!candidate) return { ...empty, reason: "candidate export absent" };
    let cand;
    try {
        cand = parseResultDocument(candidate, "candidate");
    } catch (e) {
        return { ...empty, reason: e.message };
    }
    const counts = countStatuses(cand.cases);
    if (cand.cases.length === 0) {
        return {
            compatible: true,
            incomplete: true,
            reason: "candidate recorded no cases",
            newFailures: [],
            fixedFailures: [],
            ongoingFailures: [],
            skipped: [],
            missingFromCandidate: [],
            counts,
            candidate: cand,
        };
    }
    if (cand.config?.shard) {
        return {
            compatible: true,
            incomplete: true,
            reason: `candidate is a partial shard (${cand.config.shard}); merge shards first`,
            newFailures: cand.cases.filter(isFail),
            fixedFailures: [],
            ongoingFailures: [],
            skipped: cand.cases.filter((c) => c.status === "skipped"),
            missingFromCandidate: [],
            counts,
            candidate: cand,
        };
    }
    if (!base) {
        return {
            compatible: true,
            incomplete: true,
            reason: "base export absent",
            newFailures: cand.cases.filter(isFail),
            fixedFailures: [],
            ongoingFailures: [],
            skipped: cand.cases.filter((c) => c.status === "skipped"),
            missingFromCandidate: [],
            counts,
            candidate: cand,
        };
    }
    let baseDoc;
    try {
        baseDoc = parseResultDocument(base, "base");
    } catch (e) {
        return { ...empty, reason: e.message, counts, candidate: cand };
    }
    if (baseDoc.config?.shard) {
        return {
            compatible: true,
            incomplete: true,
            reason: `base is a partial shard (${baseDoc.config.shard}); merge shards first`,
            newFailures: [],
            fixedFailures: [],
            ongoingFailures: [],
            skipped: [],
            missingFromCandidate: [],
            counts,
            candidate: cand,
            base: baseDoc,
        };
    }
    if (configKey(baseDoc) !== configKey(cand)) {
        return {
            compatible: false,
            incomplete: true,
            reason: "incompatible run configuration",
            newFailures: [],
            fixedFailures: [],
            ongoingFailures: [],
            skipped: [],
            missingFromCandidate: [],
            counts,
            candidate: cand,
            base: baseDoc,
        };
    }
    const before = outcomeMap(baseDoc);
    const after = outcomeMap(cand);
    const newFailures = [];
    const fixedFailures = [];
    const ongoingFailures = [];
    const missingFromCandidate = [];
    const skipped = cand.cases.filter((c) => c.status === "skipped");
    for (const c of sortCases(cand.cases)) {
        if (!isFail(c)) continue;
        const prev = before.get(c.id);
        if (isFail(prev)) ongoingFailures.push(c);
        else newFailures.push(c);
    }
    for (const c of sortCases(baseDoc.cases)) {
        if (!isFail(c)) continue;
        const next = after.get(c.id);
        if (next && next.status === "pass") {
            fixedFailures.push({ ...c, status: "pass", fixedFrom: c.kind });
        } else if (!next || next.status === "skipped") {
            // Absent or skipped: not a fix, and the comparison is incomplete.
            missingFromCandidate.push(c);
        }
    }
    if (missingFromCandidate.length > 0) {
        return {
            compatible: true,
            incomplete: true,
            reason: `${missingFromCandidate.length} base failure(s) missing or skipped in the candidate`,
            newFailures,
            fixedFailures,
            ongoingFailures,
            skipped,
            missingFromCandidate,
            counts,
            candidate: cand,
            base: baseDoc,
        };
    }
    return {
        compatible: true,
        incomplete: false,
        reason: null,
        newFailures,
        fixedFailures,
        ongoingFailures,
        skipped,
        missingFromCandidate: [],
        counts,
        candidate: cand,
        base: baseDoc,
    };
}

export function countStatuses(cases) {
    const counts = { cases: cases.length, pass: 0, fail: 0, skipped: 0 };
    for (const c of cases) counts[c.status] = (counts[c.status] ?? 0) + 1;
    return counts;
}

/**
 * Reads layout-change cases from an official-examples audit directory (`report.json`,
 * optional `drift.json`). Malformed JSON is treated as absent, not thrown.
 */
export function readAuditLayoutChanges(auditDir) {
    if (!auditDir) return { present: false, layoutChanges: [], drift: null, totals: null };
    const reportPath = join(auditDir, "report.json");
    let report;
    try {
        report = JSON.parse(readFileSync(reportPath, "utf8"));
    } catch (e) {
        return {
            present: false,
            layoutChanges: [],
            drift: null,
            totals: null,
            reason: e.code === "ENOENT" ? `missing ${reportPath}` : `unreadable ${reportPath}: ${e.message}`,
        };
    }
    if (!report || typeof report !== "object" || !Array.isArray(report.cases)) {
        return { present: false, layoutChanges: [], drift: null, totals: null, reason: `${reportPath}: expected cases array` };
    }
    const layoutChanges = report.cases
        .filter((c) => c.status === "layout-change")
        .map((c) => ({
            id: c.case_name,
            file: c.file,
            status: "layout-change",
            changeKind: c.changeKind,
            digest: c.digest,
            approval: c.approval ?? null,
        }))
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    let drift = null;
    try {
        drift = JSON.parse(readFileSync(join(auditDir, "drift.json"), "utf8"));
    } catch {
        // optional
    }
    return {
        present: true,
        layoutChanges,
        drift,
        totals: report.totals ?? null,
        revisions: report.revisions ?? null,
    };
}

function bulletCases(cases, { limit = 10, linkPrefix } = {}) {
    const lines = [];
    for (const c of cases.slice(0, limit)) {
        let label;
        if (c.changeKind !== undefined || c.status === "layout-change") {
            label = `\`${c.id}\`${c.changeKind ? ` · ${c.changeKind}` : ""}`;
        } else {
            label = `\`${c.file}\` width=${c.width}${c.form ? ` form=${c.form}` : ""}${c.token !== undefined ? ` token=${c.token}` : ""}${c.kind ? ` ${c.kind}` : ""}`;
        }
        lines.push(linkPrefix ? `- ${label} ([artifact](${linkPrefix}))` : `- ${label}`);
    }
    if (cases.length > limit) lines.push(`- … ${cases.length - limit} more`);
    return lines;
}

/**
 * Renders the Actions job summary. A sweep with no recorded cases is never described as green.
 * Absent or incompatible inputs are called out explicitly.
 */
export function renderReviewSummary({
    sweep,
    audit,
    artifactUrl,
    title = "Formatter review summary",
} = {}) {
    const lines = [`# ${title}`, ""];
    const hasSweep = sweep?.base != null || sweep?.candidate != null;
    const sweepCmp = compareSweepResults(sweep?.base, sweep?.candidate);

    lines.push("## Sweep comparison", "");
    if (!hasSweep) {
        lines.push(
            "- status · **absent** (no `--base` / `--candidate` export in this job)",
            "- tip · run `review:sweep --export` locally or in a sweep workflow, then `review:summary --base … --candidate …`",
            "",
        );
    } else if (sweepCmp.incomplete || !sweepCmp.compatible) {
        lines.push(`- status · **incomplete** (${sweepCmp.reason})`);
        if (sweepCmp.counts?.cases) {
            lines.push(`- recorded cases · ${sweepCmp.counts.cases} (pass ${sweepCmp.counts.pass}, fail ${sweepCmp.counts.fail}, skipped ${sweepCmp.counts.skipped})`);
        } else {
            lines.push("- recorded cases · 0");
        }
        lines.push("- result · not green (missing or incompatible data)", "");
        if (sweepCmp.missingFromCandidate?.length) {
            lines.push("### Base failures missing from the candidate", "", ...bulletCases(sweepCmp.missingFromCandidate, { linkPrefix: artifactUrl }), "");
        }
    } else {
        lines.push(
            `- new failures · ${sweepCmp.newFailures.length}`,
            `- fixed failures · ${sweepCmp.fixedFailures.length}`,
            `- ongoing failures · ${sweepCmp.ongoingFailures.length}`,
            `- skipped · ${sweepCmp.skipped.length}`,
            `- recorded cases · ${sweepCmp.counts.cases} (pass ${sweepCmp.counts.pass}, fail ${sweepCmp.counts.fail}, skipped ${sweepCmp.counts.skipped})`,
            "",
        );
        if (sweepCmp.newFailures.length) {
            lines.push("### New failures", "", ...bulletCases(sweepCmp.newFailures, { linkPrefix: artifactUrl }), "");
        }
        if (sweepCmp.fixedFailures.length) {
            lines.push("### Fixed failures", "", ...bulletCases(sweepCmp.fixedFailures, { linkPrefix: artifactUrl }), "");
        }
    }
    if (artifactUrl && hasSweep) lines.push(`Full sweep artifact: ${artifactUrl}`, "");

    lines.push("## Official examples (layout)", "");
    const auditInfo = typeof audit === "string" || audit?.present === undefined
        ? readAuditLayoutChanges(typeof audit === "string" ? audit : audit?.dir)
        : audit;
    if (!auditInfo?.present) {
        lines.push(`- status · **absent** (${auditInfo?.reason ?? "no audit report"})`);
        lines.push("- result · not green for layout (audit data missing)", "");
    } else {
        const layout = auditInfo.layoutChanges ?? [];
        lines.push(`- layout-change cases · ${layout.length}`);
        if (auditInfo.totals) {
            for (const [key, count] of Object.entries(auditInfo.totals).sort()) {
                lines.push(`- ${key} · ${count}`);
            }
        }
        lines.push("");
        if (auditInfo.drift) {
            lines.push("### Changes since the recorded baseline", "");
            for (const [type, names] of Object.entries(auditInfo.drift)) {
                lines.push(`- ${type} · ${names.length}`);
                lines.push(...names.slice(0, 20).map((name) => `  - \`${name}\``));
            }
            lines.push("");
        }
        const unapproved = layout.filter((c) => !c.approval);
        if (unapproved.length) {
            lines.push("### Layout changes (representative)", "", ...bulletCases(unapproved, { linkPrefix: artifactUrl }), "");
        }
        if (artifactUrl) lines.push(`Full audit artifact: ${artifactUrl}`, "");
    }

    return `${lines.join("\n").replace(/\n+$/, "")}\n`;
}

/** Per-command export path when `all` would otherwise overwrite one file. */
export function exportPathForCommand(path, command) {
    if (!path) return null;
    const m = /^(.*)(\.[^./]+)$/.exec(path);
    return m ? `${m[1]}.${command}${m[2]}` : `${path}.${command}`;
}
