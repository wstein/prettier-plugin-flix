import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs, promisify } from "node:util";
import { fingerprint, fmt, programProblems } from "../test/lib.mjs";
import { extractExamples } from "./extract-flix-examples.mjs";

const exec = promisify(execFile);
const formatOptions = { printWidth: 80, tabWidth: 4, useTabs: false, endOfLine: "lf" };
const hash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const baselineHeader = "case\tstatus\tchange\tsha256";
const wrapper = "def auditSnippet(): Unit = {\n";
const declaration = /^(?:@|(?:def|eff|enum|instance|mod|pub|redef|restrictable|sealed|struct|trait|type|val)\b)/;

const changeGroups = {
    "line-endings": ["Line endings and final newline", "Treat as a mechanical change when the destination convention requires it."],
    "blank-lines": ["Blank lines", "Check paragraph boundaries in the example and keep any that clarify the explanation."],
    indentation: ["Indentation", "Check that nesting reads clearly and follows the configured indent width."],
    spacing: ["Spacing and alignment", "Prefer consistent spacing and preserve alignment when it makes code easier to scan."],
    wrapping: ["Line wrapping and layout", "Review syntax units together. Keep generator, handler or rule boundaries visible."],
    other: ["Other source edits", "Inspect the exact diff and verify the syntax change with the Flix compiler."],
    unsafe: ["Formatter invariant failures", "Reduce to a regression fixture and fix the formatter before approval."],
};

export function changeKind(input, output) {
    const withoutEndings = (value) => value.replace(/\r\n?/g, "\n").replace(/\n+$/, "");
    if (withoutEndings(input) === withoutEndings(output)) return "line-endings";
    const compact = (value) => value.replace(/\s+/gu, "");
    if (compact(input) !== compact(output)) return "other";
    const lines = (value) => withoutEndings(value).split("\n");
    const before = lines(input);
    const after = lines(output);
    const same = (a, b) => a.length === b.length && a.every((line, i) => line === b[i]);
    if (same(before.map((line) => line.trimStart()), after.map((line) => line.trimStart()))) return "indentation";
    if (same(before.map(compact), after.map(compact))) return "spacing";
    if (same(before.map(compact).filter(Boolean), after.map(compact).filter(Boolean))) return "blank-lines";
    return "wrapping";
}

function unwrapSnippet(formatted) {
    const match = /^def auditSnippet\(\): Unit = \{([\s\S]*)\}\n$/.exec(formatted);
    if (!match) return undefined;
    const body = match[1];
    if (body.startsWith("\n")) {
        const indent = " ".repeat(formatOptions.tabWidth);
        return body.slice(1).split("\n").map((line) => line.startsWith(indent) ? line.slice(indent.length) : line).join("\n");
    }
    return body.trim() + "\n";
}

export async function auditExample(example) {
    if (example.language !== "flix") return { status: "other-language", reason: "Java interop example" };
    const original = example.code;
    let context = "file";
    let input = original;
    let before = fingerprint(input);
    if (before.errors.length) {
        const firstError = before.errors[0];
        const firstCode = input.replace(/^\s*(?:(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)\s*)*/, "");
        if (!declaration.test(firstCode)) {
            context = "expression-or-statements";
            const snippet = original.endsWith("\n") ? original : original + "\n";
            input = wrapper + snippet + "}\n";
            before = fingerprint(input);
            if (!before.errors.length) {
                // Show the snippet's original relative indentation within the function,
                // but use it only when the added spaces preserve the program.
                const lines = snippet.slice(0, -1).split("\n");
                const indented = lines.map((line) => line ? " ".repeat(formatOptions.tabWidth) + line : "").join("\n");
                const candidate = wrapper + indented + "\n}\n";
                const candidateFingerprint = fingerprint(candidate);
                if (programProblems(before, candidateFingerprint, { terminators: false }).length === 0) {
                    input = candidate;
                    before = candidateFingerprint;
                }
            }
        }
        if (before.errors.length) {
            return {
                status: "needs-context", reason: "Input rejected by the plugin. Check the surrounding prose, the Flix version and the compiler.",
                diagnostic: firstError, wrappedDiagnostic: context === "file" ? undefined : before.errors[0],
            };
        }
    }

    let formatted;
    try {
        formatted = await fmt(input, formatOptions);
        const problems = programProblems(before, fingerprint(formatted));
        if (problems.length) return { context, status: "invariant-failure", reason: problems.join("; "), input, formatted };
        if (await fmt(formatted, formatOptions) !== formatted) {
            return { context, status: "invariant-failure", reason: "Second formatting pass changes the output.", input, formatted };
        }
    } catch (error) {
        return { context, status: "invariant-failure", reason: error.message, input, formatted };
    }

    if (context !== "file") {
        const snippet = unwrapSnippet(formatted);
        if (snippet === undefined || programProblems(before, fingerprint(wrapper + snippet + "}\n")).length) {
            return { context, status: "needs-context", reason: "Could not safely recover the formatted fragment from its function wrapper." };
        }
        formatted = snippet;
    }
    if (original === formatted) return { context, status: "unchanged" };
    const digest = hash([context, formatOptions, original, formatted]);
    return {
        context, status: "layout-change", input: original, formatted, digest,
        changeKind: changeKind(original, formatted),
        reason: "The parser, program fingerprint and second formatting pass agree. Review the diff for readability.",
    };
}

function groupedReport(cases) {
    const lines = [
        "# Flix documentation formatter findings", "",
        "Each entry compares the extracted snippet with the formatter output byte for byte.",
        "Book code includes the last line break in the fence. Website code is the cooked JavaScript string.",
        "For fragments, the displayed result excludes the synthetic function. See report.json for locations and diagnostics.",
        "Groups use the most significant change. For example, wrapping can also change spaces.", "",
    ];
    for (const [group, [title, recommendation]] of Object.entries(changeGroups)) {
        const entries = cases.filter((item) => item.changeKind === group);
        if (!entries.length) continue;
        lines.push(`## ${title} (${entries.length})`, "", recommendation, "");
        for (const item of entries) {
            const name = item.case_name;
            const files = item.hasDiff ? ` · [before](before/${name}.flix) · [after](after/${name}.flix)` : "";
            const context = item.context === "expression-or-statements" ? " · formatted as a fragment" : "";
            lines.push(`- [${name}](${item.url})${files}${context}`);
        }
        lines.push("");
    }
    return lines.join("\n");
}

export function approvalFor(result, approval) {
    if (result.status !== "layout-change" || !approval || approval.digest !== result.digest ||
        typeof approval.reason !== "string" || !approval.reason.trim()) return undefined;
    return approval.reason.trim();
}

export function compareBaseline(previous, current) {
    const parse = (value) => {
        const [header, ...rows] = value.trimEnd().split(/\r?\n/);
        if (header !== baselineHeader) throw new Error("Invalid official example baseline header");
        const entries = new Map();
        for (const row of rows) {
            const fields = row.split("\t");
            const [name, status, , digest] = fields;
            if (!/^[a-z0-9.-]+$/.test(name) || !status || !/^[a-f0-9]{64}$/.test(digest) ||
                fields.length !== 4 || entries.has(name)) throw new Error(`Invalid official example baseline row: ${row}`);
            entries.set(name, row);
        }
        return entries;
    };
    const before = parse(previous);
    const after = parse(current);
    return {
        added: [...after.keys()].filter((name) => !before.has(name)),
        removed: [...before.keys()].filter((name) => !after.has(name)),
        changed: [...after.keys()].filter((name) => before.has(name) && before.get(name) !== after.get(name)),
    };
}

async function audit(book, website, output, reviewsPath, baselinePath) {
    const reviews = reviewsPath ? JSON.parse(await readFile(reviewsPath, "utf8")) : {};
    const previous = baselinePath ? await readFile(baselinePath, "utf8") : undefined;
    if (!reviews || typeof reviews !== "object" || Array.isArray(reviews)) throw new Error("Expected an object keyed by case name in the review file");
    const inventory = await extractExamples(book, website);
    const { examples, revisions } = inventory;
    await mkdir(output);
    const beforeDir = join(output, "before");
    const afterDir = join(output, "after");
    await Promise.all([mkdir(beforeDir), mkdir(afterDir)]);

    const cases = [];
    const totals = {};
    const baselineRows = [];
    let failed = false;
    for (const { code, ...example } of examples) {
        const result = await auditExample({ ...example, code });
        const { input, formatted, ...outcome } = result;
        const approval = approvalFor(result, Object.hasOwn(reviews, example.case_name) ? reviews[example.case_name] : undefined);
        totals[outcome.status] = (totals[outcome.status] ?? 0) + 1;
        if (outcome.status === "invariant-failure" || (reviewsPath && outcome.status === "layout-change" && !approval)) failed = true;
        const hasDiff = input !== undefined && formatted !== undefined && input !== formatted;
        if (hasDiff) {
            const filename = example.case_name + ".flix";
            await Promise.all([
                writeFile(join(beforeDir, filename), input),
                writeFile(join(afterDir, filename), formatted),
            ]);
        }
        cases.push({
            ...example, ...outcome, approval, hasDiff,
            changeKind: outcome.status === "invariant-failure" ? "unsafe" : outcome.changeKind,
        });
        const signature = hash([example.file, example.language, code, outcome.status, outcome.context,
            outcome.diagnostic, outcome.wrappedDiagnostic, formatted]);
        baselineRows.push([example.case_name, outcome.status, outcome.changeKind ?? "-", signature].join("\t"));
    }
    const baseline = [baselineHeader, ...baselineRows.sort(), ""].join("\n");
    const drift = previous === undefined ? undefined : compareBaseline(previous, baseline);
    if (drift && Object.values(drift).some((names) => names.length)) failed = true;
    const summary = ["# Official Flix examples", "", ...Object.entries(totals).map(([key, count]) => `- ${key} · ${count}`), ""];
    if (drift) {
        summary.push("## Changes since the recorded baseline", "");
        for (const [type, names] of Object.entries(drift)) {
            summary.push(`- ${type} · ${names.length}`, ...names.slice(0, 20).map((name) => `  - \`${name}\``));
        }
        summary.push("", "See `drift.json` in the audit artifact for the full list.", "");
    }
    const { stdout: diff } = await exec("git", ["diff", "--no-index", "--no-ext-diff", "--no-color", "--no-renames", "--", "before", "after"], {
        cwd: output, maxBuffer: 16 * 1024 * 1024,
    }).catch((error) => {
        if (error.code !== 1) throw error;
        return error;
    });
    await Promise.all([
        writeFile(join(output, "examples.json"), JSON.stringify(inventory, null, 2) + "\n"),
        writeFile(join(output, "report.json"), JSON.stringify({ revisions, formatOptions, totals, cases }, null, 2) + "\n"),
        writeFile(join(output, "changes.diff"), diff),
        writeFile(join(output, "findings.md"), groupedReport(cases)),
        writeFile(join(output, "baseline.tsv"), baseline),
        writeFile(join(output, "summary.md"), summary.join("\n")),
        ...(drift ? [writeFile(join(output, "drift.json"), JSON.stringify(drift, null, 2) + "\n")] : []),
    ]);
    console.log(JSON.stringify(totals, null, 2));
    if (reviewsPath) {
        console.log(`Reviewed layout changes: ${cases.filter((item) => item.approval).length}/${totals["layout-change"] ?? 0}`);
    }
    if (drift) console.log(`Baseline drift: ${drift.added.length} added, ${drift.removed.length} removed, ${drift.changed.length} changed`);
    console.log(`Report: ${join(output, "report.json")}`);
    return failed ? 1 : 0;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
    try {
        const { positionals, values } = parseArgs({
            allowPositionals: true, options: { reviews: { type: "string" }, baseline: { type: "string" } },
        });
        if (positionals.length !== 3) {
            throw new Error("Usage: npm run test:docs-examples -- <book> <flix.dev> <new-report-directory> [--reviews reviews.json] [--baseline baseline.tsv]");
        }
        process.exitCode = await audit(...positionals.map((path) => resolve(path)), values.reviews, values.baseline);
    } catch (error) {
        console.error(error.message);
        process.exitCode = 2;
    }
}
