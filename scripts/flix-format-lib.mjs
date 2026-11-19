// Pure logic of scripts/flix-format-references.mjs: diagnostics summaries, the comparison of saved
// and actual references, the validity gate, the exit code, diff output and the timeout. Nothing
// here touches the file system or starts Java, so test/flix-format-lib.test.mjs covers it directly.

export const normalize = (text) => text.replace(/\x1b\[[0-9;]*m/g, "").replace(/\r\n/g, "\n");

const HEADER = /^-- (.+? \[E\d+\]) -+[^\n]*$/;
const EXCERPT = /^\s*\d+ \|/; // a source excerpt line such as `12 | def f(): Int32 = 1`
const MARKER = /^\s*\^+\s*$/; // the caret line below an excerpt

/**
 * Summarizes the diagnostics printed by the Flix compiler, one `<header>: <message>` line each.
 *
 * Every block starts with a header line `-- <Kind> [E1234] ---- <file>`. The message is the first
 * line starting with `>>` in that block. Some errors (for example E6217 `Unused effect`, or the
 * `Unresolved constructor` family) print a highlighted source excerpt instead of a `>>` line; for
 * those the message is the first non-empty line that is neither a source excerpt line nor a caret
 * line. A block without any such line is summarized by its header alone. The number of summary
 * lines must equal the number of headers, and output without a header is an error, so a new
 * diagnostics layout can never be dropped silently.
 */
export function summarizeDiagnostics(output, label = "the compiler output") {
    const lines = normalize(output).split("\n");
    const blocks = [];
    for (const line of lines) {
        const header = HEADER.exec(line);
        if (header) blocks.push({ header: header[1], body: [] });
        else blocks.at(-1)?.body.push(line);
    }
    if (blocks.length === 0) throw new Error(`Unrecognized Flix diagnostics for ${label}:\n${normalize(output)}`);
    const summary = blocks.map(({ header, body }) => {
        const arrow = body.find((line) => line.startsWith(">>"));
        const message = arrow !== undefined
            ? arrow.slice(2)
            : body.find((line) => line.trim() !== "" && !EXCERPT.test(line) && !MARKER.test(line)) ?? "";
        return message.trim() === "" ? `${header}\n` : `${header}: ${message.trim()}\n`;
    });
    const headers = lines.filter((line) => HEADER.test(line)).length;
    if (summary.length !== headers) {
        throw new Error(`Flix diagnostics for ${label}: ${summary.length} summaries for ${headers} headers`);
    }
    return summary.join("");
}

/**
 * Compares one saved reference with the actual result of the pinned compiler.
 *
 * `saved` is `{ language, code, diagnostics }`, where `diagnostics` is the recorded output
 * diagnostics (undefined unless the fixture is flixFormatInvalid); `actual` is
 * `{ language, code, outputDiagnostics }`. The result lists
 *  - `validity`: reasons why the reference no longer has the validity the fixture records: the input
 *    is now accepted or rejected (the language flipped between `flix` and `text`), or the output
 *    became invalid or valid. These need review, so they are never written by --update;
 *  - `changes`: the parts of the reference that differ, as `{ what, saved, actual }`.
 */
export function compareReference({ saved, invalid, actual }) {
    const validity = [];
    if (saved.language !== actual.language) {
        validity.push(actual.language === "text" ? "Flix now rejects the input" : "Flix now accepts the input");
    }
    const outputInvalid = actual.outputDiagnostics !== "";
    if (actual.language === "flix" && outputInvalid !== invalid) validity.push("Flix output validity changed");
    const changes = [];
    if (validity.length === 0) {
        if (saved.code !== actual.code) changes.push({ what: "reference", saved: saved.code, actual: actual.code });
        if (invalid && (saved.diagnostics ?? "") !== actual.outputDiagnostics) {
            changes.push({ what: "output diagnostics", saved: saved.diagnostics ?? "", actual: actual.outputDiagnostics });
        }
    }
    return { validity, changes, outputInvalid };
}

/** The Prettier comparison for the progress line; a todo Output holds the desired text, not Prettier's. */
export function prettierComparison({ language, code }, { status, outputs }) {
    if (language === "text") return "Flix declined to format";
    const same = outputs.some((block) => block.code === code);
    if (status === "todo") return same ? "matches the desired Output (the todo gap)" : "differs from the desired Output";
    return same ? "matches a Prettier snapshot" : "differs from Prettier snapshots";
}

/**
 * Decides what to report, write and exit with. `entries` holds, per fixture,
 * `{ file, status, outputs, invalid, saved, actual }` or `{ file, crash }` when the Flix driver crashed
 * on that input. Every fixture is reported; nothing is written (even for other fixtures) while any
 * validity changed or any fixture crashed, and the exit code is non-zero then and for any
 * change outside update mode.
 */
export function assess(entries, { update = false, verbose = false } = {}) {
    const lines = [];
    const writes = [];
    let blocked = false;
    let changed = false;
    const results = entries.map((entry) => {
        if (entry.crash !== undefined) {
            blocked = true;
            lines.push({ error: true, text: `${entry.file}: the Flix driver crashed:\n${entry.crash.trimEnd()}` });
            return null;
        }
        const { validity, changes, outputInvalid } = compareReference(entry);
        for (const reason of validity) {
            blocked = true;
            lines.push({ error: true, text: `${entry.file}: ${reason}` });
        }
        const diagnosticsChanged = changes.some((change) => change.what === "output diagnostics");
        if (outputInvalid && entry.actual.outputDiagnostics !== "" && (verbose || diagnosticsChanged || validity.length > 0)) {
            lines.push({ text: `${entry.file}: Flix output fails to type-check:\n${entry.actual.outputDiagnostics.trimEnd()}` });
        }
        lines.push({ text: `${entry.file}: ${prettierComparison(entry.actual, entry)}` });
        return changes;
    });
    entries.forEach((entry, index) => {
        const changes = results[index];
        if (!changes?.length) return;
        changed = true;
        for (const change of changes) {
            lines.push({ text: `${entry.file}: ${change.what} ${update && !blocked ? "updated" : "changed"}\n${unifiedDiff(change.saved, change.actual)}` });
        }
        writes.push(index);
    });
    if (blocked) {
        lines.push({ error: true, text: "Not writing any reference: review the fixtures reported above." });
    }
    return { lines, writes: blocked || !update ? [] : writes, exitCode: blocked || (changed && !update) ? 1 : 0 };
}

/** Unified-style line diff (`-` saved, `+` actual, three lines of context). Empty when equal. */
export function unifiedDiff(saved, actual, context = 3) {
    const a = saved === "" ? [] : saved.replace(/\n$/, "").split("\n");
    const b = actual === "" ? [] : actual.replace(/\n$/, "").split("\n");
    // Longest common subsequence table, filled from the end so the script reads front to back.
    const lcs = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = a.length - 1; i >= 0; i--) {
        for (let j = b.length - 1; j >= 0; j--) {
            lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
        }
    }
    const script = [];
    let i = 0;
    let j = 0;
    while (i < a.length || j < b.length) {
        if (i < a.length && j < b.length && a[i] === b[j]) script.push([" ", a[i++], j++]);
        else if (i < a.length && (j === b.length || lcs[i + 1][j] >= lcs[i][j + 1])) script.push(["-", a[i++]]);
        else script.push(["+", b[j++]]);
    }
    // Keep every changed entry and `context` unchanged entries around it, grouped into hunks.
    const keep = script.map(([op]) => op !== " ");
    const near = keep.map((_, index) => keep.slice(Math.max(0, index - context), index + context + 1).some(Boolean));
    const out = [];
    let oldLine = 1;
    let newLine = 1;
    for (let index = 0; index < script.length;) {
        if (!near[index]) {
            const [op] = script[index++];
            if (op !== "+") oldLine++;
            if (op !== "-") newLine++;
            continue;
        }
        const hunk = [];
        const startOld = oldLine;
        const startNew = newLine;
        while (index < script.length && near[index]) {
            const [op, text] = script[index++];
            hunk.push(op + text);
            if (op !== "+") oldLine++;
            if (op !== "-") newLine++;
        }
        const oldCount = oldLine - startOld;
        const newCount = newLine - startNew;
        out.push(`@@ -${startOld},${oldCount} +${startNew},${newCount} @@`, ...hunk);
    }
    return out.join("\n");
}

/** Milliseconds allowed for the JVM: about 10 s of startup plus 1.6 s per fixture, with ample slack. */
export function timeoutMs(count, env = {}) {
    const override = env.FLIX_FORMAT_TIMEOUT_MS;
    if (override !== undefined && override !== "") {
        if (!/^[1-9]\d{0,9}$/.test(override)) throw new Error(`FLIX_FORMAT_TIMEOUT_MS must be a positive integer, found "${override}"`);
        return Number(override);
    }
    return 60_000 + 15_000 * count;
}
