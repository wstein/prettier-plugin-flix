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
const wrapper = "def auditSnippet(): Unit = {\n";
const declaration = /^(?:@|(?:def|eff|enum|instance|mod|pub|redef|restrictable|sealed|struct|trait|type|val)\b)/;

export async function auditExample(example) {
    if (example.language !== "flix") return { status: "other-language", reason: "Java interop example" };
    const original = example.code.endsWith("\n") ? example.code : example.code + "\n";
    let context = "file";
    let input = original;
    let before = fingerprint(input);
    if (before.errors.length) {
        const firstError = before.errors[0];
        const firstCode = input.replace(/^\s*(?:(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)\s*)*/, "");
        if (!declaration.test(firstCode)) {
            context = "expression-or-statements";
            input = wrapper + original + "}\n";
            before = fingerprint(input);
            if (!before.errors.length) {
                // Show the snippet's original relative indentation within the function,
                // but use it only when the added spaces preserve the program.
                const lines = original.slice(0, -1).split("\n");
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

    if (input === formatted) return { context, status: "unchanged" };
    const digest = createHash("sha256").update(JSON.stringify([context, formatOptions, original, formatted])).digest("hex");
    return {
        context, status: "layout-change", input, formatted, digest,
        reason: "The parser, program fingerprint and second formatting pass agree. Review the diff for readability.",
    };
}

export function approvalFor(result, approval) {
    if (result.status !== "layout-change" || !approval || approval.digest !== result.digest ||
        typeof approval.reason !== "string" || !approval.reason.trim()) return undefined;
    return approval.reason.trim();
}

async function audit(book, website, output, reviewsPath) {
    const reviews = reviewsPath ? JSON.parse(await readFile(reviewsPath, "utf8")) : {};
    if (!reviews || typeof reviews !== "object" || Array.isArray(reviews)) throw new Error("Expected an object keyed by case name in the review file");
    const { examples, revisions } = await extractExamples(book, website);
    await mkdir(output);
    const beforeDir = join(output, "before");
    const afterDir = join(output, "after");
    await Promise.all([mkdir(beforeDir), mkdir(afterDir)]);

    const cases = [];
    const totals = {};
    let failed = false;
    for (const { code, ...example } of examples) {
        const result = await auditExample({ ...example, code });
        const { input, formatted, ...outcome } = result;
        const approval = approvalFor(result, Object.hasOwn(reviews, example.case_name) ? reviews[example.case_name] : undefined);
        totals[outcome.status] = (totals[outcome.status] ?? 0) + 1;
        if (outcome.status === "invariant-failure" || (reviewsPath && outcome.status === "layout-change" && !approval)) failed = true;
        if (input !== undefined && formatted !== undefined) {
            const filename = example.case_name + ".flix";
            await Promise.all([
                writeFile(join(beforeDir, filename), input),
                writeFile(join(afterDir, filename), formatted),
            ]);
        }
        cases.push({ ...example, ...outcome, approval });
    }
    const { stdout: diff } = await exec("git", ["diff", "--no-index", "--no-ext-diff", "--no-color", "--no-renames", "--", "before", "after"], {
        cwd: output, maxBuffer: 16 * 1024 * 1024,
    }).catch((error) => {
        if (error.code !== 1) throw error;
        return error;
    });
    await Promise.all([
        writeFile(join(output, "report.json"), JSON.stringify({ revisions, formatOptions, totals, cases }, null, 2) + "\n"),
        writeFile(join(output, "changes.diff"), diff),
    ]);
    console.log(JSON.stringify(totals, null, 2));
    if (reviewsPath) {
        console.log(`Reviewed layout changes: ${cases.filter((item) => item.approval).length}/${totals["layout-change"] ?? 0}`);
    }
    console.log(`Report: ${join(output, "report.json")}`);
    return failed ? 1 : 0;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
    try {
        const { positionals, values } = parseArgs({ allowPositionals: true, options: { reviews: { type: "string" } } });
        if (positionals.length !== 3) {
            throw new Error("Usage: npm run test:docs-examples -- <book> <flix.dev> <new-report-directory> [--reviews reviews.json]");
        }
        process.exitCode = await audit(...positionals.map((path) => resolve(path)), values.reviews);
    } catch (error) {
        console.error(error.message);
        process.exitCode = 2;
    }
}
